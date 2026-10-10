/**
 * APS Truckload - resume upload handler (Google Apps Script)
 * Emails each application to the team with the resume attached.
 *
 * SETUP
 * 1. Go to script.google.com > New project and paste this file in.
 * 2. Deploy > New deployment > type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 * 3. Authorize when prompted, copy the Web app URL, and paste it into
 *    CAREERS_ENDPOINT in index.html.
 * 4. After any later code change: Deploy > Manage deployments > edit > New version.
 */
var NOTIFY_EMAIL = 'dispatch@apstruckloads.ca';
var MAX_BYTES = 5 * 1024 * 1024;
var ALLOWED_EXT = ['pdf', 'doc', 'docx'];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    // Basic validation
    if (!d.name || !d.email || !d.phone || !d.fileData || !d.fileName) throw new Error('Missing fields');
    var ext = String(d.fileName).split('.').pop().toLowerCase();
    if (ALLOWED_EXT.indexOf(ext) === -1) throw new Error('Bad file type');

    var bytes = Utilities.base64Decode(d.fileData);
    if (bytes.length > MAX_BYTES) throw new Error('File too large');

    var safeName = String(d.name).replace(/[^\w\- ]/g, '').trim() || 'Applicant';
    var resume = Utilities.newBlob(bytes, d.mimeType || 'application/octet-stream',
                                   safeName + ' - Resume.' + ext);

    var body =
      'New job application\n\n' +
      'Name: ' + d.name + '\n' +
      'Email: ' + d.email + '\n' +
      'Phone: ' + d.phone + '\n' +
      'Position: ' + (d.position || 'Not specified') + '\n\n' +
      'Message:\n' + (d.message || '(none)');

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: d.email,
      subject: 'Job application: ' + d.name + ' - ' + (d.position || 'General'),
      body: body,
      attachments: [resume]
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}