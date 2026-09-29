# Receipt Room

A React interface for uploading receipt photos and reviewing OCR-extracted line items. The API calls the existing `receipt_scanner.py` implementation and keeps uploaded images and OCR fallback files out of the scanner repository.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.10+
- Tesseract OCR installed and available on `PATH`
- The existing `receipt-ocr` repository with its Python dependencies installed

By default, the API looks for `../receipt-ocr/receipt_scanner.py`. Set `RECEIPT_SCANNER_PATH` to point to the scanner file if it is elsewhere.

## Run locally

In one terminal, install the small API dependency set into the Python environment that already has the scanner requirements, then start the API:

```sh
python -m pip install -r api-requirements.txt
python -m uvicorn api:app --reload --port 8000
```

In another terminal, start the React app:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The dev server proxies `/api` requests to the Python service on port 8000.

## Notes

- Supported images: JPG, PNG, WEBP, BMP, and TIFF, up to 15 MB.
- OCR and rule-based parsing run locally. Uploaded files are stored temporarily and removed after extraction.
- Store and date are inferred from filenames ending in `YYYYMMDD`; line items are parsed using the existing scanner rules.
