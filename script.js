let currentGrandTotal = 0;
let qrInstance = null;

const DEFAULT_WHATSAPP = '+919716588121';
const DEFAULT_EMAIL = 'nextroenergyenterprises@gmail.com';

const gstStateCodes = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "19": "West Bengal", "24": "Gujarat",
  "27": "Maharashtra", "29": "Karnataka", "33": "Tamil Nadu", "36": "Telangana"
};

// Initialize Date
document.getElementById('docDate').valueAsDate = new Date();

/* ====== Font Family & Text Case Switchers ====== */
function changeFontFamily(fontFamily) {
  document.getElementById('invoiceArea').style.fontFamily = fontFamily;
  document.querySelectorAll('#invoiceArea *').forEach(el => {
    el.style.fontFamily = fontFamily;
  });
}

function changeTextCase(caseType) {
  const invoiceArea = document.getElementById('invoiceArea');
  invoiceArea.classList.remove('case-uppercase', 'case-capitalize');
  if (caseType === 'uppercase') {
    invoiceArea.classList.add('case-uppercase');
  } else if (caseType === 'capitalize') {
    invoiceArea.classList.add('case-capitalize');
  }
}

/* ====== Sync Target Top Toolbar Fields ====== */
function syncTargetShareFields() {
  const mobile = document.getElementById('partyMobile').value;
  const email = document.getElementById('partyEmail').value;
  if (mobile) document.getElementById('targetShareNumber').value = mobile;
  if (email) document.getElementById('targetShareEmail').value = email;
}

/* ====== Sync Billed To & Second Address ====== */
function syncAddresses() {
  if (document.getElementById('sameAsBilling').checked) {
    document.getElementById('secondName').value = document.getElementById('partyName').value;
    document.getElementById('secondGst').value = document.getElementById('partyGst').value;
    document.getElementById('secondAddress').value = document.getElementById('partyAddress').value;
  }
}

document.getElementById('partyName').addEventListener('input', syncAddresses);
document.getElementById('partyGst').addEventListener('input', syncAddresses);

/* ====== Update Sr No (#) ====== */
function updateRowIndices() {
  document.querySelectorAll('#billBody tr').forEach((row, index) => {
    const srSpan = row.querySelector('.sr-no');
    if (srSpan) srSpan.innerText = index + 1;
  });
}

/* ====== Category Switch (Sales vs Service) ====== */
function handleCategoryChange() {
  const category = document.getElementById('billCategory').value;
  const isService = category === 'SERVICE';

  document.getElementById('thDesc').innerText = isService ? 'Service Description' : 'Item / Product Name';
  document.getElementById('thCode').innerText = isService ? 'SAC Code' : 'HSN Code';
  document.getElementById('thRate').innerText = isService ? 'Rate / Fee (₹)' : 'Rate (₹)';
  document.getElementById('lblPartyAddress').innerText = isService ? 'Address :' : 'Billing Addr :';

  const secondPartyHeading = document.getElementById('secondPartyHeading');
  const lblSecondName = document.getElementById('lblSecondName');
  const lblSecondGst = document.getElementById('lblSecondGst');
  const lblSecondAddress = document.getElementById('lblSecondAddress');

  if (isService) {
    secondPartyHeading.innerText = 'Service / Site Details';
    lblSecondName.innerText = 'Site/Proj :';
    lblSecondGst.innerText = 'Site GSTIN :';
    lblSecondAddress.innerText = 'Site Addr :';
    document.getElementById('secondName').placeholder = 'Client Site / Project Name';
    document.getElementById('secondGst').placeholder = 'Site / Branch GSTIN (Optional)';
    document.getElementById('secondAddress').placeholder = 'Service Location / Site Address';
  } else {
    secondPartyHeading.innerText = 'Shipped To (Delivery)';
    lblSecondName.innerText = 'Ship Name :';
    lblSecondGst.innerText = 'Ship GSTIN :';
    lblSecondAddress.innerText = 'Ship Addr :';
    document.getElementById('secondName').placeholder = 'Delivery / Consignee Name';
    document.getElementById('secondGst').placeholder = 'Shipment GSTIN (Optional)';
    document.getElementById('secondAddress').placeholder = 'Full Delivery Address with State & PIN';
  }

  handleDocTypeChange();
  calculate();
}

/* ====== Dynamic DocType Switch (INV, QT, PO, PI) ====== */
function handleDocTypeChange() {
  const docType = document.getElementById('docType').value;
  const category = document.getElementById('billCategory').value;
  const isQuotation = docType === 'QT';

  const title = document.getElementById('docTitle');
  const partyHeading = document.getElementById('partyHeading');
  const lblPartyName = document.getElementById('lblPartyName');
  const lblPartyGst = document.getElementById('lblPartyGst');
  const lblDocNo = document.getElementById('lblDocNo');
  const lblDocDate = document.getElementById('lblDocDate');
  
  const secondPartyCol = document.getElementById('secondPartyCol');
  const supplyTypeBox = document.getElementById('supplyTypeContainer');
  const subtotalLabel = document.getElementById('subtotalLabel');
  const bankDetailsBox = document.getElementById('bankDetailsBox');
  const qrCardBox = document.getElementById('qrCardBox');
  const gstBreakupContainer = document.getElementById('gstBreakupContainer');

  const year = new Date().getFullYear();
  let cnt = parseInt(localStorage.getItem(`cnt_${docType}_${year}`)) || 1;

  if (isQuotation) {
    bankDetailsBox.style.display = 'none';
    qrCardBox.style.display = 'none';
    gstBreakupContainer.style.display = 'none';
  } else {
    bankDetailsBox.style.display = 'block';
    qrCardBox.style.display = 'flex';
    gstBreakupContainer.style.display = 'block';
  }

  if (isQuotation) {
    title.innerText = 'QUOTATION / ESTIMATE';
    partyHeading.innerText = 'Quoted To (Client)';
    lblPartyName.innerText = 'Name :';
    lblPartyGst.innerText = 'GSTIN :';
    lblDocNo.innerText = 'Quote Ref :';
    lblDocDate.innerText = 'Quote Date :';
    document.getElementById('invoiceNumber').value = `QT-${year}-${String(cnt).padStart(3, '0')}`;

    secondPartyCol.style.display = 'none';
    supplyTypeBox.style.display = 'none';
    document.querySelectorAll('.col-gst').forEach(el => el.style.display = 'none');
    subtotalLabel.innerText = 'Subtotal:';
  } else if (docType === 'INV') {
    title.innerText = 'TAX INVOICE';
    partyHeading.innerText = category === 'SERVICE' ? 'Billed To (Client)' : 'Billed To (Buyer)';
    lblPartyName.innerText = 'Name :';
    lblPartyGst.innerText = 'GSTIN :';
    lblDocNo.innerText = 'Invoice No :';
    lblDocDate.innerText = 'Invoice Date :';
    document.getElementById('invoiceNumber').value = `INV-${year}-${String(cnt).padStart(3, '0')}`;

    secondPartyCol.style.display = 'block';
    supplyTypeBox.style.display = 'block';
    document.querySelectorAll('.col-gst').forEach(el => el.style.display = '');
    subtotalLabel.innerText = 'Taxable Subtotal:';
  } else if (docType === 'PI') {
    title.innerText = 'PROFORMA INVOICE';
    partyHeading.innerText = category === 'SERVICE' ? 'Billed To (Client)' : 'Billed To (Buyer)';
    lblPartyName.innerText = 'Name :';
    lblPartyGst.innerText = 'GSTIN :';
    lblDocNo.innerText = 'PI Number :';
    lblDocDate.innerText = 'PI Date :';
    document.getElementById('invoiceNumber').value = `PI-${year}-${String(cnt).padStart(3, '0')}`;

    secondPartyCol.style.display = 'block';
    supplyTypeBox.style.display = 'block';
    document.querySelectorAll('.col-gst').forEach(el => el.style.display = '');
    subtotalLabel.innerText = 'Taxable Subtotal:';
  } else if (docType === 'PO') {
    title.innerText = 'PURCHASE ORDER';
    partyHeading.innerText = 'Vendor (Supplier)';
    lblPartyName.innerText = 'Name :';
    lblPartyGst.innerText = 'GSTIN :';
    lblDocNo.innerText = 'PO Number :';
    lblDocDate.innerText = 'PO Date :';
    document.getElementById('invoiceNumber').value = `PO-${year}-${String(cnt).padStart(3, '0')}`;

    secondPartyCol.style.display = 'block';
    supplyTypeBox.style.display = 'block';
    document.querySelectorAll('.col-gst').forEach(el => el.style.display = '');
    subtotalLabel.innerText = 'Taxable Subtotal:';
  }

  calculate();
}

/* ====== Convert Number to Indian Words ====== */
function numToWords(num) {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) !== 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += (Number(n_array[2]) !== 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += (Number(n_array[3]) !== 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += (Number(n_array[4]) !== 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += (Number(n_array[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str;
  }

  let whole = Math.floor(num);
  let fraction = Math.round((num - whole) * 100);
  let res = inWords(whole) + 'Rupees ';
  if (fraction > 0) res += 'and ' + inWords(fraction) + 'Paise ';
  return res + 'Only';
}

/* ====== Calculate Totals & GST Slabs ====== */
function calculate() {
  let subtotal = 0;
  let isInterState = document.getElementById('placeOfSupply').value === 'OTHER';
  let isQuotation = document.getElementById('docType').value === 'QT';
  let totalTax = 0;
  let gstSlabs = { '0': 0, '5': 0, '12': 0, '18': 0, '28': 0 };

  document.querySelectorAll('#billBody tr').forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const gstRate = row.querySelector('.item-gst').value;

    const taxable = qty * rate;
    row.querySelector('.item-taxable').innerText = taxable.toFixed(2);
    subtotal += taxable;

    if (!isQuotation) {
      const rateVal = parseFloat(gstRate) || 0;
      const taxAmount = (taxable * rateVal) / 100;
      totalTax += taxAmount;

      if (gstSlabs[gstRate] !== undefined) {
        gstSlabs[gstRate] += taxable;
      } else {
        gstSlabs[gstRate] = taxable;
      }
    }
  });

  if (isQuotation) {
    document.getElementById('cgstRow').style.display = 'none';
    document.getElementById('sgstRow').style.display = 'none';
    document.getElementById('igstRow').style.display = 'none';
    document.getElementById('roundOffRow').style.display = 'none';
  } else {
    document.getElementById('roundOffRow').style.display = 'table-row';
    if (isInterState) {
      document.getElementById('cgstRow').style.display = 'none';
      document.getElementById('sgstRow').style.display = 'none';
      document.getElementById('igstRow').style.display = 'table-row';
      document.getElementById('igstAmount').innerText = `₹${totalTax.toFixed(2)}`;
    } else {
      document.getElementById('cgstRow').style.display = 'table-row';
      document.getElementById('sgstRow').style.display = 'table-row';
      document.getElementById('igstRow').style.display = 'none';
      document.getElementById('cgstAmount').innerText = `₹${(totalTax / 2).toFixed(2)}`;
      document.getElementById('sgstAmount').innerText = `₹${(totalTax / 2).toFixed(2)}`;
    }

    let breakupHtml = '';
    for (let slab in gstSlabs) {
      let taxVal = gstSlabs[slab];
      if (taxVal > 0) {
        let rate = parseFloat(slab);
        let slabTax = (taxVal * rate) / 100;
        let cgst = isInterState ? 0 : slabTax / 2;
        let sgst = isInterState ? 0 : slabTax / 2;
        let igst = isInterState ? slabTax : 0;

        breakupHtml += `
          <tr>
            <td>GST @ ${slab}%</td>
            <td class="text-right">₹${taxVal.toFixed(2)}</td>
            <td class="text-right">₹${cgst.toFixed(2)}</td>
            <td class="text-right">₹${sgst.toFixed(2)}</td>
            <td class="text-right">₹${igst.toFixed(2)}</td>
            <td class="text-right font-bold">₹${slabTax.toFixed(2)}</td>
          </tr>
        `;
      }
    }
    document.getElementById('gstBreakupBody').innerHTML = breakupHtml || '<tr><td colspan="6" class="text-center text-muted">No taxable items added.</td></tr>';
  }

  const rawTotal = subtotal + totalTax;
  const rounded = isQuotation ? rawTotal : Math.round(rawTotal);
  const roundOff = rounded - rawTotal;

  currentGrandTotal = rounded;
  document.getElementById('subTotal').innerText = `₹${subtotal.toFixed(2)}`;
  document.getElementById('roundOffVal').innerText = `₹${roundOff.toFixed(2)}`;
  document.getElementById('grandTotal').innerText = `₹${rounded.toFixed(2)}`;
  document.getElementById('amountWords').innerText = numToWords(rounded);

  updateQRCode();
}

/* ====== Add/Remove Line Items ====== */
function addRow(desc='', code='', qty=1, unit='Nos', rate=0, gst='18') {
  const isService = document.getElementById('billCategory').value === 'SERVICE';
  const isQuotation = document.getElementById('docType').value === 'QT';
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="text-center font-bold"><span class="sr-no"></span></td>
    <td><input type="text" class="item-desc" placeholder="${isService ? 'Service Details' : 'Product Name'}" value="${desc}"></td>
    <td><input type="text" class="item-code" placeholder="${isService ? 'SAC Code' : 'HSN Code'}" value="${code}"></td>
    <td class="col-qty"><input type="number" class="text-center item-qty" value="${qty}" min="1" oninput="calculate()"></td>
    <td class="col-unit">
      <select class="item-unit select-unit">
        <option value="Nos" ${unit==='Nos'?'selected':''}>Nos</option>
        <option value="Day" ${unit==='Day'?'selected':''}>Day</option>
        <option value="Pcs" ${unit==='Pcs'?'selected':''}>Pcs</option>
        <option value="Kg" ${unit==='Kg'?'selected':''}>Kg</option>
        <option value="Mtr" ${unit==='Mtr'?'selected':''}>Mtr</option>
        <option value="Box" ${unit==='Box'?'selected':''}>Box</option>
        <option value="Ltr" ${unit==='Ltr'?'selected':''}>Ltr</option>
        <option value="Pkt" ${unit==='Pkt'?'selected':''}>Pkt</option>
        <option value="Hrs" ${unit==='Hrs'?'selected':''}>Hrs</option>
      </select>
    </td>
    <td><input type="number" class="text-right item-rate" value="${rate}" min="0" oninput="calculate()"></td>
    <td class="col-gst" style="${isQuotation ? 'display:none;' : ''}">
      <select class="item-gst select-gst" onchange="calculate()">
        <option value="0" ${gst==='0'?'selected':''}>0%</option>
        <option value="5" ${gst==='5'?'selected':''}>5%</option>
        <option value="12" ${gst==='12'?'selected':''}>12%</option>
        <option value="18" ${gst==='18'?'selected':''}>18%</option>
        <option value="28" ${gst==='28'?'selected':''}>28%</option>
      </select>
    </td>
    <td class="text-right item-taxable">0.00</td>
    <td class="text-center action-col" data-html2canvas-ignore="true"><button class="btn-del" onclick="deleteRow(this)">✕</button></td>
  `;
  document.getElementById('billBody').appendChild(tr);
  updateRowIndices();
  calculate();
}

function deleteRow(btn) {
  if (document.querySelectorAll('#billBody tr').length > 1) {
    btn.closest('tr').remove();
    updateRowIndices();
    calculate();
  }
}

/* ====== LocalStorage: Profile & Images ====== */
function saveCompanyProfile() {
  const comp = {
    name: document.getElementById('compName').value,
    tagline: document.getElementById('compTagline').value,
    website: document.getElementById('compWebsite').value,
    addr: document.getElementById('compAddress').value,
    phone: document.getElementById('compPhone').value,
    email: document.getElementById('compEmail').value,
    gst: document.getElementById('compGst').value,
    bank: document.getElementById('bankName').value,
    acc: document.getElementById('accNo').value,
    ifsc: document.getElementById('ifscCode').value,
    upi: document.getElementById('upiId').value,
    terms: document.getElementById('termsText').value,
    logo: localStorage.getItem('saved_logo_img') || '',
    sign: localStorage.getItem('saved_sign_img') || ''
  };
  localStorage.setItem('company_master_profile', JSON.stringify(comp));
  alert('Company profile & settings saved permanently!');
}

function loadCompanyProfile() {
  const data = localStorage.getItem('company_master_profile');
  if (data) {
    const comp = JSON.parse(data);
    if (comp.name) document.getElementById('compName').value = comp.name;
    if (comp.tagline) document.getElementById('compTagline').value = comp.tagline;
    if (comp.website) document.getElementById('compWebsite').value = comp.website;
    if (comp.addr) document.getElementById('compAddress').value = comp.addr;
    if (comp.phone) document.getElementById('compPhone').value = comp.phone;
    if (comp.email) document.getElementById('compEmail').value = comp.email;
    if (comp.gst) document.getElementById('compGst').value = comp.gst;
    if (comp.bank) document.getElementById('bankName').value = comp.bank;
    if (comp.acc) document.getElementById('accNo').value = comp.acc;
    if (comp.ifsc) document.getElementById('ifscCode').value = comp.ifsc;
    if (comp.upi) document.getElementById('upiId').value = comp.upi;
    if (comp.terms) document.getElementById('termsText').value = comp.terms;
  }

  const savedLogo = localStorage.getItem('saved_logo_img');
  if (savedLogo) {
    document.getElementById('logoImg').src = savedLogo;
    document.getElementById('logoImg').style.display = 'block';
    document.getElementById('logoPlaceholder').style.display = 'none';
  }

  const savedSign = localStorage.getItem('saved_sign_img');
  if (savedSign) {
    document.getElementById('signImg').src = savedSign;
    document.getElementById('signImg').style.display = 'block';
    document.getElementById('signPlaceholder').style.display = 'none';
  }
}

function previewAndAutoSaveImage(e, imgId, phId, storageKey) {
  const f = e.target.files[0];
  if (f) {
    const r = new FileReader();
    r.onload = ev => {
      document.getElementById(imgId).src = ev.target.result;
      document.getElementById(imgId).style.display = 'block';
      if (phId) document.getElementById(phId).style.display = 'none';
      localStorage.setItem(storageKey, ev.target.result);
    };
    r.readAsDataURL(f);
  }
}

/* ====== GST Auto-detect from State Code ====== */
function autoDetectStateFromGST() {
  const myGst = document.getElementById('compGst').value.trim();
  const partyGst = document.getElementById('partyGst').value.trim();

  if (partyGst.length >= 2) {
    const pCode = partyGst.substring(0, 2);
    if (gstStateCodes[pCode]) {
      document.getElementById('partyStateCode').value = `${pCode} - ${gstStateCodes[pCode]}`;
    } else {
      document.getElementById('partyStateCode').value = pCode;
    }

    if (myGst.length >= 2) {
      if (myGst.substring(0, 2) === pCode) {
        document.getElementById('placeOfSupply').value = 'SAME';
      } else {
        document.getElementById('placeOfSupply').value = 'OTHER';
      }
    }
    calculate();
  }
}

/* ====== PDF Download & Web Share ====== */
function downloadDirectPDF() {
  const element = document.getElementById('invoiceArea');
  const invoiceNo = document.getElementById('invoiceNumber').value || 'Document';
  const opt = {
    margin: [5, 5, 5, 5],
    filename: `${invoiceNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

async function shareDirectPdfFile() {
  const element = document.getElementById('invoiceArea');
  const invoiceNo = document.getElementById('invoiceNumber').value || 'Document';
  const docTitle = document.getElementById('docTitle').innerText;
  const comp = document.getElementById('compName').value || 'Nextro Energy Enterprises';
  const grandTotal = document.getElementById('grandTotal').innerText;

  const opt = {
    margin: [5, 5, 5, 5],
    filename: `${invoiceNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
    const pdfFile = new File([pdfBlob], `${invoiceNo}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        title: `${docTitle} - ${invoiceNo}`,
        text: `Greeting from ${comp}. Please find attached ${docTitle} (${invoiceNo}) for ₹${grandTotal}.`,
        files: [pdfFile]
      });
    } else {
      alert("Direct file attachment is not supported on this browser. The PDF is being downloaded. You can now send it to the opened WhatsApp chat.");
      downloadDirectPDF();
      shareWhatsApp();
    }
  } catch (err) {
    console.error("Sharing error:", err);
  }
}

function updateQRCode() {
  const upi = document.getElementById('upiId').value.trim();
  const comp = document.getElementById('compName').value.trim() || 'Nextro Energy Enterprises';
  const container = document.getElementById('qrcode');
  container.innerHTML = '';
  
  if (!upi || currentGrandTotal <= 0) return;

  const uri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(comp)}&am=${currentGrandTotal.toFixed(2)}&cu=INR`;
  new QRCode(container, { text: uri, width: 75, height: 75 });
}

function shareWhatsApp() {
  const customPhone = document.getElementById('targetShareNumber').value.trim();
  const partyMobile = document.getElementById('partyMobile').value.trim();
  
  let rawPhone = customPhone || partyMobile || DEFAULT_WHATSAPP;
  let cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
  
  const invoiceNo = document.getElementById('invoiceNumber').value;
  const grandTotal = document.getElementById('grandTotal').innerText;
  const comp = document.getElementById('compName').value || 'Nextro Energy Enterprises';
  
  const text = `*Greeting from ${comp}*%0A%0AYour *${document.getElementById('docTitle').innerText}* is ready:%0A📄 *Doc No:* ${invoiceNo}%0A💰 *Grand Total:* ${grandTotal}%0A📅 *Date:* ${document.getElementById('docDate').value}%0A%0AFor any queries, contact: ${DEFAULT_WHATSAPP}%0AThank you!`;
  window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
}

function shareEmail() {
  const customEmail = document.getElementById('targetShareEmail').value.trim();
  const partyEmail = document.getElementById('partyEmail').value.trim();
  const targetEmail = customEmail || partyEmail || DEFAULT_EMAIL;

  const invoiceNo = document.getElementById('invoiceNumber').value;
  const docTitle = document.getElementById('docTitle').innerText;
  const comp = document.getElementById('compName').value || 'Nextro Energy Enterprises';
  const grandTotal = document.getElementById('grandTotal').innerText;

  const subject = encodeURIComponent(`${docTitle} - ${invoiceNo} from ${comp}`);
  const body = encodeURIComponent(`Dear ${document.getElementById('partyName').value || 'Customer'},\n\nPlease find the details for your ${docTitle} below:\n\nDocument No: ${invoiceNo}\nDate: ${document.getElementById('docDate').value}\nTotal Amount: ${grandTotal}\n\nFor any support, email us at ${DEFAULT_EMAIL} or call ${DEFAULT_WHATSAPP}.\n\nBest Regards,\n${comp}`);

  window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
}

/* ====== LocalStorage Invoice Management ====== */
function saveCurrentInvoice() {
  const items = [];
  document.querySelectorAll('#billBody tr').forEach(r => {
    items.push({
      desc: r.querySelector('.item-desc').value,
      code: r.querySelector('.item-code').value,
      qty: r.querySelector('.item-qty').value,
      unit: r.querySelector('.item-unit').value,
      rate: r.querySelector('.item-rate').value,
      gst: r.querySelector('.item-gst') ? r.querySelector('.item-gst').value : '0'
    });
  });

  const inv = {
    id: document.getElementById('invoiceNumber').value,
    category: document.getElementById('billCategory').value,
    docType: document.getElementById('docType').value,
    docDate: document.getElementById('docDate').value,
    partyName: document.getElementById('partyName').value,
    partyMobile: document.getElementById('partyMobile').value,
    partyEmail: document.getElementById('partyEmail').value,
    partyGst: document.getElementById('partyGst').value,
    partyStateCode: document.getElementById('partyStateCode').value,
    placeOfSupply: document.getElementById('placeOfSupply').value,
    partyAddress: document.getElementById('partyAddress').value,
    secondName: document.getElementById('secondName').value,
    secondGst: document.getElementById('secondGst').value,
    secondAddress: document.getElementById('secondAddress').value,
    total: currentGrandTotal,
    items: items
  };

  let db = JSON.parse(localStorage.getItem('billing_enterprise_db') || '[]');
  const idx = db.findIndex(x => x.id === inv.id);
  if (idx >= 0) db[idx] = inv; else db.unshift(inv);
  
  localStorage.setItem('billing_enterprise_db', JSON.stringify(db));
  
  if (inv.partyName) {
    let clients = JSON.parse(localStorage.getItem('clients_dir') || '{}');
    clients[inv.partyName] = { 
      mobile: inv.partyMobile, 
      email: inv.partyEmail,
      gst: inv.partyGst, 
      addr: inv.partyAddress, 
      stateCode: inv.partyStateCode,
      secondName: inv.secondName,
      secondGst: inv.secondGst,
      secondAddr: inv.secondAddress
    };
    localStorage.setItem('clients_dir', JSON.stringify(clients));
    populateClientsDropdown();
  }
  
  updateHistoryCount();
  alert(`Document ${inv.id} saved successfully!`);
}

function populateClientsDropdown() {
  const clients = JSON.parse(localStorage.getItem('clients_dir') || '{}');
  const dl = document.getElementById('clientList');
  dl.innerHTML = '';
  for (let k in clients) {
    let opt = document.createElement('option');
    opt.value = k;
    dl.appendChild(opt);
  }
}

function autoFillClient(name) {
  const clients = JSON.parse(localStorage.getItem('clients_dir') || '{}');
  if (clients[name]) {
    document.getElementById('partyMobile').value = clients[name].mobile || '';
    document.getElementById('partyEmail').value = clients[name].email || '';
    document.getElementById('partyGst').value = clients[name].gst || '';
    document.getElementById('partyAddress').value = clients[name].addr || '';
    document.getElementById('partyStateCode').value = clients[name].stateCode || '';
    document.getElementById('secondName').value = clients[name].secondName || '';
    document.getElementById('secondGst').value = clients[name].secondGst || '';
    document.getElementById('secondAddress').value = clients[name].secondAddr || '';
    syncTargetShareFields();
    autoDetectStateFromGST();
  }
}

function updateHistoryCount() {
  const db = JSON.parse(localStorage.getItem('billing_enterprise_db') || '[]');
  document.getElementById('historyCount').innerText = db.length;
}

function openHistoryModal() {
  const db = JSON.parse(localStorage.getItem('billing_enterprise_db') || '[]');
  const tbody = document.getElementById('historyBody');
  tbody.innerHTML = '';
  db.forEach(x => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${x.id}</strong></td>
      <td><span class="cat-badge">${x.category || 'SALES'}</span></td>
      <td>${x.docType}</td>
      <td>${x.partyName || '-'}</td>
      <td>${x.docDate}</td>
      <td>₹${x.total}</td>
      <td class="text-center">
        <button class="btn btn-primary btn-load" onclick="loadInvoice('${x.id}')">Load</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById('historyModal').style.display = 'flex';
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

function loadInvoice(id) {
  const db = JSON.parse(localStorage.getItem('billing_enterprise_db') || '[]');
  const inv = db.find(x => x.id === id);
  if (!inv) return;

  document.getElementById('billCategory').value = inv.category || 'SALES';
  document.getElementById('docType').value = inv.docType;
  handleCategoryChange();
  document.getElementById('invoiceNumber').value = inv.id;
  document.getElementById('docDate').value = inv.docDate;
  
  document.getElementById('partyName').value = inv.partyName || '';
  document.getElementById('partyMobile').value = inv.partyMobile || '';
  document.getElementById('partyEmail').value = inv.partyEmail || '';
  document.getElementById('partyGst').value = inv.partyGst || '';
  document.getElementById('partyStateCode').value = inv.partyStateCode || '';
  document.getElementById('placeOfSupply').value = inv.placeOfSupply || 'SAME';
  document.getElementById('partyAddress').value = inv.partyAddress || '';
  
  document.getElementById('secondName').value = inv.secondName || '';
  document.getElementById('secondGst').value = inv.secondGst || '';
  document.getElementById('secondAddress').value = inv.secondAddress || '';

  syncTargetShareFields();

  const tb = document.getElementById('billBody');
  tb.innerHTML = '';
  inv.items.forEach(i => addRow(i.desc, i.code || i.hsn, i.qty, i.unit, i.rate, i.gst));
  closeHistoryModal();
}

function resetForm() {
  if (confirm("Clear and start new document?")) {
    document.getElementById('billBody').innerHTML = '';
    document.getElementById('partyName').value = '';
    document.getElementById('partyMobile').value = '';
    document.getElementById('partyEmail').value = '';
    document.getElementById('partyGst').value = '';
    document.getElementById('partyStateCode').value = '';
    document.getElementById('partyAddress').value = '';
    document.getElementById('secondName').value = '';
    document.getElementById('secondGst').value = '';
    document.getElementById('secondAddress').value = '';
    document.getElementById('targetShareNumber').value = '';
    document.getElementById('targetShareEmail').value = '';
    document.getElementById('sameAsBilling').checked = false;
    addRow();
    handleDocTypeChange();
  }
}

// Initial System Run
loadCompanyProfile();
addRow();
handleCategoryChange();
updateHistoryCount();
populateClientsDropdown();