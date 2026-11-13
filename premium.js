(() => {
  'use strict';
  const cfg = window.JobProfitKitPaymentConfig || {};
  const btn = document.getElementById('premium-pay-link');
  const status = document.getElementById('premium-not-live');
  const fulfilment = document.getElementById('premium-delivery');
  const emailBtn = document.getElementById('premium-email-link');
  const preflight = document.getElementById('premium-preflight');
  const deliveryCheck = document.getElementById('premium-check-delivery');
  const consentCheck = document.getElementById('premium-check-consent');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cfg.sellerEmail||''));
  let validUrl = false;
  try { const u = new URL(String(cfg.monzoPaymentLink || ''));
    validUrl = u.protocol === 'https:' && u.hostname === 'monzo.com' && u.pathname.startsWith('/pay/r/') && !u.username && !u.password;
  } catch {}
  // Client-side checks are a publishing safety gate, NOT a payment validation system.
  if (!cfg.launchApproved || !cfg.verifiedPriceAndProduct || !cfg.sellerContactAddress?.trim() || !validUrl || !emailValid) return;
  preflight.hidden = false;
  btn.hidden = false;
  const updatePayButton = () => {
    const accepted = deliveryCheck.checked && consentCheck.checked;
    btn.href = accepted ? cfg.monzoPaymentLink : '#premium-preflight';
    btn.target = accepted ? '_blank' : '_self';
    btn.setAttribute('aria-disabled', String(!accepted));
    btn.style.opacity = accepted ? '1' : '.52';
    btn.textContent = accepted ? 'Pay £9.99 through Monzo ↗' : 'Tick both boxes to pay £9.99';
  };
  deliveryCheck.addEventListener('change', updatePayButton);
  consentCheck.addEventListener('change', updatePayButton);
  updatePayButton();
  status.hidden = true;
  fulfilment.hidden = false;
  const subject = encodeURIComponent('JobProfitKit UK: premium workbook order');
  const body = encodeURIComponent('Hello,\n\nI paid £9.99 for the JobProfitKit UK Premium Workbook using the Monzo business payment link.\n\nName on bank transfer: \nApproximate time/date of payment: \nEmail to deliver workbook to: \n\nI request supply of this digital content within my 14-day cancellation period. I acknowledge that once supply of the download begins, I will lose my statutory right to cancel for change of mind. I understand my rights if the digital content is faulty are unaffected.\n\nPlease confirm my order and email the workbook when the Monzo payment has been verified.');
  emailBtn.href=`mailto:${cfg.sellerEmail}?subject=${subject}&body=${body}`;
})();
