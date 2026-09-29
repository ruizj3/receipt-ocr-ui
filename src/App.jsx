import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const fileInput = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [items, setItems] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)

  useEffect(() => {
    if (!preview) return undefined
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  function selectFile(nextFile) {
    if (!nextFile) return
    const extension = nextFile.name.split('.').pop()?.toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'].includes(extension)) {
      setError('Choose a JPG, PNG, WEBP, BMP, or TIFF image.')
      return
    }
    setFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
    setItems([])
    setReceipt(null)
    setError('')
  }

  async function extractReceipt() {
    if (!file) return
    setIsProcessing(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || 'Extraction failed.')
      setItems(result.items)
      setReceipt(result)
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the extraction service.')
    } finally {
      setIsProcessing(false)
    }
  }

  function updateItem(index, field, value) {
    setItems((currentItems) => currentItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    ))
  }

  function clearReceipt() {
    setFile(null)
    setPreview('')
    setItems([])
    setReceipt(null)
    setError('')
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Receipt Room home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>receipt<span className="brand-light">room</span></span>
        </a>
        <div className="topbar-meta"><span className="live-dot" /> LOCAL WORKSPACE</div>
      </header>

      <section className="workspace" id="top">
        <div className="intro-row">
          <div>
            <p className="eyebrow">RECEIPT DATA, WITHOUT THE RE-TYPING</p>
            <h1>Make every line<br /><span>count.</span></h1>
          </div>
          <p className="intro-note">Bring in a receipt image. We’ll turn the fine print into a clean, editable list.</p>
        </div>

        <div className="work-grid">
          <section className="upload-panel" aria-labelledby="upload-title">
            <div className="section-heading">
              <div className="step-number">01</div>
              <div><p className="section-kicker">START WITH A PHOTO</p><h2 id="upload-title">Add a receipt</h2></div>
            </div>

            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <button
              className={`drop-zone${isDragging ? ' is-dragging' : ''}${preview ? ' has-preview' : ''}`}
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setIsDragging(false)
                selectFile(event.dataTransfer.files?.[0])
              }}
              aria-label="Choose or drop a receipt image"
            >
              {preview ? (
                <>
                  <img className="receipt-preview" src={preview} alt="Selected receipt preview" />
                  <span className="preview-shade" />
                  <span className="preview-label"><span className="file-icon">IMG</span>{file?.name}</span>
                </>
              ) : (
                <span className="drop-content">
                  <span className="upload-glyph" aria-hidden="true"><span /></span>
                  <span className="drop-title">Drop your receipt here</span>
                  <span className="drop-subtitle">or <span className="browse-link">browse files</span></span>
                  <span className="file-types">JPG · PNG · WEBP · TIFF</span>
                </span>
              )}
            </button>

            {error && <p className="error-message" role="alert">{error}</p>}
            <div className="upload-actions">
              <span className="privacy-note"><span aria-hidden="true">◉</span> Processed on your machine</span>
              {file && <button className="text-button" type="button" onClick={clearReceipt}>Remove</button>}
            </div>
            <button className="extract-button" type="button" onClick={extractReceipt} disabled={!file || isProcessing}>
              {isProcessing ? <><span className="spinner" /> Reading receipt…</> : <>Extract line items <span aria-hidden="true">↗</span></>}
            </button>
            <p className="engine-note">Uses your local OCR engine. No image leaves this computer.</p>
          </section>

          <section className="results-panel" aria-labelledby="results-title">
            <div className="section-heading results-heading">
              <div className="step-number">02</div>
              <div><p className="section-kicker">CHECK THE DETAILS</p><h2 id="results-title">Line items <span className="item-count">{items.length ? String(items.length).padStart(2, '0') : '—'}</span></h2></div>
              {items.length > 0 && <button className="clear-button" type="button" onClick={clearReceipt} aria-label="Clear extracted receipt">×</button>}
            </div>

            {receipt && <div className="receipt-meta"><span>{receipt.store_name || file?.name}</span><span>{receipt.purchase_date || 'Date not detected'}</span></div>}

            <div className="table-wrap">
              <table>
                <thead><tr><th className="item-column">ITEM</th><th>QTY</th><th>UNIT</th><th className="total-column">TOTAL</th></tr></thead>
                <tbody>
                  {items.length ? items.map((item, index) => (
                    <tr key={`${item.product_name}-${index}`}>
                      <td><input aria-label={`Item ${index + 1} name`} value={item.product_name} onChange={(event) => updateItem(index, 'product_name', event.target.value)} /></td>
                      <td><input aria-label={`Item ${index + 1} quantity`} value={item.quantity ?? ''} onChange={(event) => updateItem(index, 'quantity', event.target.value)} placeholder="—" /></td>
                      <td><input aria-label={`Item ${index + 1} unit price`} value={item.unit_price ?? ''} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} placeholder="—" /></td>
                      <td><input className="price-input" aria-label={`Item ${index + 1} total price`} value={item.total_price ?? ''} onChange={(event) => updateItem(index, 'total_price', event.target.value)} placeholder="—" /></td>
                    </tr>
                  )) : (
                    <tr className="empty-row"><td colSpan="4"><span className="empty-mark" aria-hidden="true">↳</span><span>{isProcessing ? 'Scanning the receipt for items…' : 'Your extracted items will appear here.'}</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>{items.length ? `${items.length} ${items.length === 1 ? 'item' : 'items'} detected` : 'Waiting for a receipt'}</span>
              {items.length > 0 && <span className="edit-hint">Fields are editable</span>}
            </div>
          </section>
        </div>
      </section>
      <footer className="page-footer"><span>RECEIPT ROOM</span><span>OCR, made useful.</span></footer>
    </main>
  )
}

export default App
