document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  const { userId } = getAuth();
  const emergencyUrl = `${window.location.origin}/emergency.html?id=${userId}`;

  // Generate QR
  const qrcode = new QRCode(document.getElementById("qrcode"), {
    text: emergencyUrl,
    width: 200,
    height: 200,
    colorDark : "#e53935",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  // Handle Download
  document.getElementById('download-btn').addEventListener('click', () => {
    const canvas = document.querySelector('#qrcode canvas');
    if (!canvas) {
      showAlert('QR Code not ready yet');
      return;
    }
    const image = canvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");
    const link = document.createElement('a');
    link.download = "carbuddy-qr.png";
    link.href = image;
    link.click();
  });
});
