import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://kolwacpvfxdrptldipzj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbHdhY3B2ZnhkcnB0bGRpcHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYzOTMsImV4cCI6MjA3NzQwMjM5M30.cXXOxBkX9KaddhfY5JoAvMGz-ohxdCoh5iQlHMUGHqE'
);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Récupérer tous les documents sans embedding
        const { data: documents, error } = await supabase
            .from('ark_documents')
            .select('id, projet_nom, contenu')
            .is('embedding', null)
            .limit(50);

        if (error) throw error;

        if (!documents || documents.length === 0) {
            return res.status(200).json({ 
                message: 'Tous les documents ont déjà des embeddings',
                processed: 0 
            });
        }

        let processed = 0;
        let failed = 0;

        // Générer les embeddings un par un
        for (const doc of documents) {
            try {
                // Prendre les 500 premiers caractères du contenu
                const textToEmbed = `${doc.projet_nom} - ${doc.contenu.substring(0, 500)}`;

                const embeddingResponse = await fetch('https://api.deepseek.com/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-embedding-v2',
                        input: textToEmbed
                    })
                });

                if (!embeddingResponse.ok) {
                    console.error(`Erreur embedding pour doc ${doc.id}`);
                    failed++;
                    continue;
                }

                const embeddingData = await embeddingResponse.json();
                const embedding = embeddingData.data[0].embedding;

                // Sauvegarder l'embedding
                const { error: updateError } = await supabase
                    .from('ark_documents')
                    .update({ embedding })
                    .eq('id', doc.id);

                if (updateError) {
                    console.error(`Erreur update pour doc ${doc.id}:`, updateError);
                    failed++;
                } else {
                    processed++;
                }

                // Pause de 100ms entre chaque appel pour éviter le rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (err) {
                console.error(`Erreur pour doc ${doc.id}:`, err);
                failed++;
            }
        }

        return res.status(200).json({ 
            message: `Embeddings générés avec succès`,
            processed,
            failed,
            total: documents.length
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
