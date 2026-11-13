// Public business settings only. NO credentials or private bank data.
// Paid checkout uses seller-provided reusable Monzo link.
// Seller must confirm the displayed amount/product and link reusability in Monzo.
// There is NO automated payment verification or digital delivery.
window.JobProfitKitPaymentConfig = {
  sellerName: 'Craig Robertson, sole trader trading as CR Surface Solutions (JobProfitKit UK)',
  sellerEmail: 'Lothianlocalconnect@outlook.com',
  sellerContactAddress: '8 Laburnum Place, Mayfield, Dalkeith, Midlothian, EH22 5EY, United Kingdom', // Public business correspondence address supplied by the owner
  monzoPaymentLink: 'https://monzo.com/pay/r/cr-surface-solutions_lt3XvmpJNoTKUS',
  verifiedPriceAndProduct: true, // Seller-provided link, subject to owner checking £9.99/product
  launchApproved: true // Owner requested launch; orders manually verified and delivered by email
};
