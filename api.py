import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile


DEFAULT_SCANNER = Path(__file__).resolve().parent.parent / "receipt-ocr" / "receipt_scanner.py"
SCANNER_PATH = Path(os.environ.get("RECEIPT_SCANNER_PATH", DEFAULT_SCANNER)).expanduser().resolve()
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
MAX_UPLOAD_BYTES = 15 * 1024 * 1024

if not SCANNER_PATH.is_file():
    raise RuntimeError(
        f"Receipt scanner not found at {SCANNER_PATH}. "
        "Set RECEIPT_SCANNER_PATH to receipt_scanner.py."
    )

sys.path.insert(0, str(SCANNER_PATH.parent))
import receipt_scanner


app = FastAPI(title="Receipt OCR API")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/extract")
def extract_receipt(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Use a JPG, PNG, WEBP, BMP, or TIFF receipt image.")

    image_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="The image must be smaller than 15 MB.")

    with tempfile.TemporaryDirectory(prefix="receipt-ocr-") as temp_dir:
        image_path = Path(temp_dir) / f"upload{suffix}"
        image_path.write_bytes(image_bytes)
        ocr_text = receipt_scanner.ocr_receipt_to_text(str(image_path), save_output=False)
        receipt = receipt_scanner.fallback_receipt_from_ocr_text(file.filename or "", ocr_text)

    if receipt is None or not receipt.items:
        raise HTTPException(status_code=422, detail="No line items could be read. Try a clearer, well-lit image.")

    store_name, purchase_date = receipt_scanner.extract_store_and_date_from_filename(file.filename or "")
    receipt.store_name = store_name
    receipt.purchase_date = purchase_date.strftime("%Y-%m-%d") if isinstance(purchase_date, datetime) else None
    return {
        "store_name": receipt.store_name,
        "purchase_date": receipt.purchase_date,
        "items": [item.model_dump() for item in receipt.items],
    }