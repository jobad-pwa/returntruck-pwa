// api/share.js
// Vercel Serverless Function for dynamic WhatsApp previews

module.exports = async (req, res) => {
    const { listing } = req.query;
    
    // Default fallback
    let ogTitle = 'ReturnTruck - Find Loads & Trucks';
    let ogDescription = 'Connect with load givers, fleet operators, and agents across India.';
    let ogImage = 'https://returntruck.com/og-image.png';
    let redirectUrl = 'https://returntruck-pwa.vercel.app/';

    if (listing) {
        const parts = listing.split('_');
        if (parts.length === 2) {
            const type = parts[0]; // 'LOAD', 'TRUCK', or 'AGENT'
            const id = parts[1];

            try {
                // Fetch specific data from Supabase
                const SB_URL = 'https://ghjoffovatgvhzxlupef.supabase.co';
                const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoam9mZm92YXRndmh6eGx1cGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDM4MjQsImV4cCI6MjEwMDk3OTgyNH0.bGDIHZDcLdZqJl9u5qhDm5mlGfWR3fp1sxrpwCtsDsg';

                let table = '';
                if (type === 'LOAD') table = 'active_loads';
                else if (type === 'TRUCK') table = 'active_trucks';
                else if (type === 'AGENT') table = 'active_users';

                const response = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}&select=*`, {
                    headers: {
                        'apikey': SB_KEY,
                        'Authorization': `Bearer ${SB_KEY}`
                    }
                });
                const data = await response.json();

                if (data && data.length > 0) {
                    const item = data[0];

                    // Helper: get location name (simplified - you'd want the full LOCATIONS lookup here)
                    // For now, we just use the PIN as text since the serverless function doesn't have your LOCATIONS array
                    const pickupPin = item.pickup_pin || item.location_pin;
                    const dropPin = item.drop_pin;

                    if (type === 'LOAD') {
                        ogTitle = `📦 ${item.material || 'Cargo'} - ₹${(item.rate || 0).toLocaleString('en-IN')}`;
                        ogDescription = `From: ${pickupPin} → To: ${dropPin}\nWeight: ${item.weight || 0} Kg | Vehicle: ${item.vehicle_type || 'Any'}`;
                        // Optional: Use a dynamic image generator for the OG image
                        ogImage = `https://your-vercel-app.vercel.app/api/og?title=${encodeURIComponent(item.material)}&rate=${item.rate}`;
                    } else if (type === 'TRUCK') {
                        ogTitle = `🚛 Truck: ${item.truck_no || 'Unknown'}`;
                        ogDescription = `Location: ${pickupPin} | Rate: ₹${item.rate || 0}/KM`;
                    } else if (type === 'AGENT') {
                        ogTitle = `🤝 ${item.company_name || item.name || 'Agent'}`;
                        ogDescription = `Trusted Logistics Agent`;
                    }
                }
            } catch (error) {
                console.error('Error fetching data for share:', error);
            }

            // Redirect the real user to the app
            redirectUrl = `https://returntruck-pwa.vercel.app/?listing=${listing}`;
        }
    }

    // Serve an HTML page with dynamic OG tags
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${ogTitle}</title>
        <meta property="og:title" content="${ogTitle}">
        <meta property="og:description" content="${ogDescription}">
        <meta property="og:image" content="${ogImage}">
        <meta property="og:url" content="${redirectUrl}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${ogTitle}">
        <meta name="twitter:description" content="${ogDescription}">
        <meta name="twitter:image" content="${ogImage}">
    </head>
    <body>
        <p>Redirecting to ReturnTruck...</p>
        <script>
            window.location.href = "${redirectUrl}";
        </script>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
};
