/**
 * Devi Network: Pulse Relay Worker
 * Deploy this to Cloudflare Workers.
 * Bind an R2 Bucket to variable 'BUCKET'.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const bucket = env.BUCKET; // Your R2 Bucket

    // CORS Headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Content-Type': 'application/json',
    };

    if (method === 'OPTIONS') {
      return new Response('OK', { headers });
    }

    // --- 1. THE DROP (Staff Upload) ---
    // POST /drop
    if (path === '/drop' && method === 'POST') {
      try {
        const payload = await request.json();
        const pharmacyId = payload.pharmacyId;
        const packetId = payload.id;
        
        // Save to R2: /inbox/pharmacy_id/packet_id.json
        const key = `inbox/${pharmacyId}/${packetId}.json`;
        await bucket.put(key, JSON.stringify(payload));

        return new Response(JSON.stringify({ success: true, id: packetId }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
      }
    }

    // --- 2. THE PICKUP (Admin Download) ---
    // GET /pickup?pharmacyId=...
    if (path === '/pickup' && method === 'GET') {
      const pharmacyId = url.searchParams.get('pharmacyId');
      if (!pharmacyId) return new Response('Missing ID', { status: 400 });

      // List all files in inbox
      const prefix = `inbox/${pharmacyId}/`;
      const list = await bucket.list({ prefix });
      
      const packets = [];
      for (const obj of list.objects) {
        const file = await bucket.get(obj.key);
        const data = await file.json();
        packets.push(data);
        
        // MOVE TO ARCHIVE (The Developer's Copy)
        // We write a copy to /archive/ and delete from /inbox/
        const archiveKey = obj.key.replace('inbox/', 'archive/');
        await bucket.put(archiveKey, JSON.stringify(data));
        await bucket.delete(obj.key);
      }

      return new Response(JSON.stringify(packets), { headers });
    }
    
    // --- 3. THE DUMP (Developer Access) ---
    // GET /dev/dump
    // Returns a link to download the entire 'archive' folder (Mock implementation)
    if (path === '/dev/dump') {
        return new Response(JSON.stringify({ message: "Use R2 Dashboard or rclone to download /archive/" }), { headers });
    }

    return new Response('Not Found', { status: 404 });
  },
};

const path = new URL(request.url).pathname; // Bug fix for snippet context
