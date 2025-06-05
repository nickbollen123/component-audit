import formidable from 'formidable';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { scanComponents } from '../../../utils/scanComponents';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({ uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload failed' });

    const zipPath = files.zipfile.filepath;
    const extractPath = path.join('/tmp', `extracted-${Date.now()}`);
    fs.ensureDirSync(extractPath);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    const components = await scanComponents(extractPath);
    return res.status(200).json({ components });
  });
}
