// FICHIER : api/generate-pdf.js
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium-min';
import puppeteer from 'puppeteer-core';

const supabase = createClient(
    'https://ehaxnltgapcfxhwpqhyb.supabase.co',
    'COLLER_VOTRE_BASE64_ICI'
);

const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { documentId, userId, ownerName, projectName, createdAt } = req.body;

    if (!documentId || !userId) {
        return res.status(400).json({ error: 'documentId et userId requis' });
    }

    try {
        // 1. Vérifier si le PDF existe déjà dans Supabase Storage
        const pdfPath = `${userId}/${documentId}.pdf`;
        const { data: existingFile } = await supabase.storage
            .from('documents-pdf')
            .getPublicUrl(pdfPath);

        if (existingFile && existingFile.publicUrl) {
            // Vérifier que le fichier existe vraiment
            const checkRes = await fetch(existingFile.publicUrl, { method: 'HEAD' });
            if (checkRes.ok) {
                return res.status(200).json({ success: true, pdfUrl: existingFile.publicUrl });
            }
        }

        // 2. Récupérer le document HTML depuis Supabase
        const { data: doc, error: docError } = await supabase
            .from('ark_documents')
            .select('contenu, doc_type, projet_nom, created_at')
            .eq('id', documentId)
            .eq('user_id', userId)
            .single();

        if (docError || !doc) {
            return res.status(404).json({ error: 'Document introuvable' });
        }

        // 3. Préparer le HTML avec les placeholders remplacés
        const formattedDate = new Date(doc.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        let htmlContent = doc.contenu
            .replace(/\{\{OWNER_NAME\}\}/g, ownerName || 'Utilisateur Ark')
            .replace(/\{\{PROJECT_NAME\}\}/g, projectName || doc.projet_nom || 'Projet')
            .replace(/\{\{DATE\}\}/g, formattedDate)
            .replace(/arkintelligence\.vercel\.app/g, 'www.arkintelligence.africa')
            .replace(/https:\/\/arkintelligence\.vercel\.app/g, 'https://www.arkintelligence.africa')
            .replace(/src="\/assets\/logo\.png"/g, 'src="https://www.arkintelligence.africa/assets/logo.png"');

        const isLandscape = htmlContent.includes('dt-wrapper') || htmlContent.includes('bmc-wrapper');

        const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: white; }
</style>
</head>
<body>${htmlContent}</body>
</html>`;

        // 4. Lancer Puppeteer et générer le PDF
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(CHROMIUM_URL),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: isLandscape,
            printBackground: true,
            margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
        });

        await browser.close();

        // 5. Stocker le PDF dans Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('documents-pdf')
            .upload(pdfPath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Erreur upload PDF:', uploadError);
            return res.status(500).json({ error: 'Erreur stockage PDF' });
        }

        // 6. Récupérer l'URL publique
        const { data: urlData } = supabase.storage
            .from('documents-pdf')
            .getPublicUrl(pdfPath);

        return res.status(200).json({ success: true, pdfUrl: urlData.publicUrl });

    } catch (error) {
        console.error('Erreur generate-pdf:', error);
        return res.status(500).json({ error: 'Erreur génération PDF' });
    }
}
