-- Snapshot do dia 27/08/2026 (buscado via Utmify MCP)
-- Execute DEPOIS de criar a tabela utmify_snapshots

insert into utmify_snapshots (
  date, dashboard_id,
  gross_revenue_cents, net_revenue_cents, profit_cents, pending_revenue_cents,
  total_orders, approved_orders, pending_orders, refunded_orders,
  ad_spend_cents, meta_spend_cents, tiktok_spend_cents, google_spend_cents,
  roi, roas, cpa_cents, avg_ticket_cents, profit_margin, clicks,
  pix_orders, card_orders, card_refused,
  products_data, hourly_data, synced_at
) values (
  '2026-08-27',
  '69237242b4c22f67823df830',
  124832, 113922, 24131, 3315,
  65, 62, 1, 0,
  89791, 89791, 0, 0,
  1.2687, 1.3903, 1448, 1837, 0.2118, 500,
  49, 12, 2,
  '[
    {"productName":"Aquarelas da Natureza - Desenhos e Guia de Pintura","count":17,"revenue":56355},
    {"productName":"Aquarelas Personalizadas","count":8,"revenue":26520},
    {"productName":"Biblioteca Ilustrada de Mesa Posta em Macramê","count":6,"revenue":17405},
    {"productName":"Guia Visual de Misturas para Aquarela","count":9,"revenue":7128},
    {"productName":"100 Paletas Prontas para Aquarela","count":7,"revenue":5544},
    {"productName":"Guia Visual de Texturas para Aquarela","count":6,"revenue":4752},
    {"productName":"50 Projetos Extras de Mesa Posta em Macramê","count":4,"revenue":3168},
    {"productName":"Biblioteca de Nós Decorativos","count":3,"revenue":2376},
    {"productName":"Guia de Presentes em Macramê","count":2,"revenue":1584}
  ]'::jsonb,
  '[
    {"hour":0,"revenue_cents":0,"profit_cents":-412,"investment_cents":412},
    {"hour":1,"revenue_cents":0,"profit_cents":-593,"investment_cents":593},
    {"hour":2,"revenue_cents":0,"profit_cents":-286,"investment_cents":286},
    {"hour":3,"revenue_cents":0,"profit_cents":-313,"investment_cents":313},
    {"hour":4,"revenue_cents":0,"profit_cents":-369,"investment_cents":369},
    {"hour":5,"revenue_cents":3315,"profit_cents":1147,"investment_cents":2168},
    {"hour":6,"revenue_cents":0,"profit_cents":-6926,"investment_cents":6926},
    {"hour":7,"revenue_cents":14844,"profit_cents":3367,"investment_cents":11477},
    {"hour":8,"revenue_cents":4107,"profit_cents":-6916,"investment_cents":11023},
    {"hour":9,"revenue_cents":18012,"profit_cents":9937,"investment_cents":8075},
    {"hour":10,"revenue_cents":18012,"profit_cents":9290,"investment_cents":8722},
    {"hour":11,"revenue_cents":7460,"profit_cents":1328,"investment_cents":6132},
    {"hour":12,"revenue_cents":4899,"profit_cents":-1474,"investment_cents":6373},
    {"hour":13,"revenue_cents":6630,"profit_cents":2648,"investment_cents":3982},
    {"hour":14,"revenue_cents":6630,"profit_cents":2724,"investment_cents":3906},
    {"hour":15,"revenue_cents":9006,"profit_cents":3497,"investment_cents":5509},
    {"hour":16,"revenue_cents":8214,"profit_cents":2837,"investment_cents":5377},
    {"hour":17,"revenue_cents":11382,"profit_cents":7522,"investment_cents":3860},
    {"hour":18,"revenue_cents":12321,"profit_cents":8088,"investment_cents":4233},
    {"hour":19,"revenue_cents":0,"profit_cents":-285,"investment_cents":285},
    {"hour":20,"revenue_cents":0,"profit_cents":0,"investment_cents":0},
    {"hour":21,"revenue_cents":0,"profit_cents":0,"investment_cents":0},
    {"hour":22,"revenue_cents":0,"profit_cents":0,"investment_cents":0},
    {"hour":23,"revenue_cents":0,"profit_cents":0,"investment_cents":0}
  ]'::jsonb,
  now()
)
on conflict (date) do update set
  gross_revenue_cents   = excluded.gross_revenue_cents,
  net_revenue_cents     = excluded.net_revenue_cents,
  profit_cents          = excluded.profit_cents,
  ad_spend_cents        = excluded.ad_spend_cents,
  meta_spend_cents      = excluded.meta_spend_cents,
  roi                   = excluded.roi,
  roas                  = excluded.roas,
  approved_orders       = excluded.approved_orders,
  products_data         = excluded.products_data,
  hourly_data           = excluded.hourly_data,
  synced_at             = now();
