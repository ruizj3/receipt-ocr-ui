# Receipt Room

A React interface for uploading receipt photos and reviewing OCR-extracted line items. This repository contains only the frontend; the Python API and OCR scanner live in the sibling `receipt-ocr` repository.

## Requirements

- Node.js 20.19+ or 22.12+
- The `receipt-ocr` API running on port 8000

## Run locally

Start the API from the sibling `receipt-ocr` directory:

```sh
python -m pip install -r requirements.txt -r api-requirements.txt
python -m uvicorn api:app --reload --port 8000
```

Then start the UI from this directory:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The dev server proxies `/api` requests to the Python API on port 8000.

## Docker

With `receipt-ocr` and `receipt-ocr-ui` checked out as sibling directories, run
these commands from the `receipt-ocr-ui` directory:

```sh
docker compose up --build
```

Open `http://localhost:8080`, choose a sample image such as
`../receipt-ocr/receipts/Safeway20250505.jpg`, and select **Extract line items**
to test the complete UI and API flow. The UI image contains only the static
frontend and Nginx; the Python API runs in a separate container. Stop the stack
with `Ctrl+C`, then remove its containers and network with:

```sh
docker compose down
```

To build both images and run the batch scanner against receipts in the sibling
repository:

```sh
docker compose --profile batch build
docker compose --profile batch run --rm receipt-ocr
```

## Notes

- Supported images: JPG, PNG, WEBP, BMP, and TIFF, up to 15 MB.
- The browser uploads the image to the Python API for OCR and parsing. The API writes it to a temporary file and removes it after extraction; the API host can access the image while processing it.
- Store and date are inferred from filenames ending in `YYYYMMDD`; line items are parsed using the existing scanner rules.
