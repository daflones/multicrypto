import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  console.log('🚨 TEST WEBHOOK CHAMADO!', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  })

  return new Response(
    JSON.stringify({ 
      status: 'ok',
      message: 'Test webhook funcionando',
      timestamp: new Date().toISOString(),
      method: req.method
    }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    }
  )
})
