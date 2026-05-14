-- =============================================================================
-- Migration 0021 — Seed Saurabh Arora (canonical reference client)
-- =============================================================================
-- Production-safe seed: stable UUIDs so the org + canvases exist in local,
-- staging, and production after migrations apply. Mirrors the pattern in
-- 0009_seed_core.sql.
--
-- This file is auto-generated from lib/workflow-canvas/seed/saurabh-arora.ts.
-- Re-generate with:  pnpm dlx tsx scripts/generate-saurabh-seed.mjs
--
-- Saurabh Arora — Refined Oil Distribution / C&F Operations.
-- Referred by Avinash Group (partner).
-- Canvases:
--   * Current Manual Workflow (25 nodes, 24 edges)
--   * Proposed ERP Workflow   (17 nodes, 16 edges)
--   * ERP + AI Workflow       (8 nodes, 17 edges)
--   * Combined view           (all of the above)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Partner org (Avinash Group)
-- ---------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, type, region, billing_email, metadata) VALUES
  ('22222222-2222-2222-2222-222222220001'::uuid,
   'Avinash Group — Partner Referral',
   'avinash-partner',
   'partner',
   'ap-south-1',
   'partner@avinash.example.com',
   '{"channel":"partner_referral"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Client org (Saurabh Arora)
-- ---------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, slug, type, region, billing_email, metadata) VALUES
  ('22222222-2222-2222-2222-222222220002'::uuid,
   'Saurabh Arora — Refined Oil Distribution',
   'saurabh-arora',
   'client',
   'ap-south-1',
   'finance@saurabh-arora.example.com',
   '{"industry":"refined_oil_distribution","business":"C&F Operations"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.client_settings (organization_id, industry, deployment_type, modules_enabled, currency)
VALUES ('22222222-2222-2222-2222-222222220002'::uuid,
        'refined_oil_distribution',
        'cloud',
        ARRAY['workflow_canvas','agentic_workflows','decision_intelligence']::text[],
        'INR')
ON CONFLICT (organization_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Project
-- ---------------------------------------------------------------------------
INSERT INTO public.projects (
  id, organization_id, partner_org_id, partner_visible_to_client,
  name, slug, description, status, industry_label, business_label, badges
) VALUES (
  '22222222-2222-2222-2222-222222220003'::uuid,
  '22222222-2222-2222-2222-222222220002'::uuid,
  '22222222-2222-2222-2222-222222220001'::uuid,
  true,
  'Saurabh Arora — ERP + AI Workflow Blueprint',
  'erp-ai-blueprint',
  'Refined oil distribution / C&F operations: discovery, ERP design, AI overlay, proposal preparation.',
  'discovery',
  'Refined Oil Distribution',
  'Refined Oil Distribution / C&F Operations',
  ARRAY['Actual Client','Partner Referral','Discovery','ERP + AI Workflow']::text[]
)
ON CONFLICT (organization_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Canvases (one per phase + combined)
-- ---------------------------------------------------------------------------
INSERT INTO public.workflow_canvases (
  id, organization_id, project_id, template_slug,
  title, subtitle, canvas_type, status, visibility, badges
) VALUES
  ('22222222-2222-2222-2222-222222220010'::uuid,
   '22222222-2222-2222-2222-222222220002'::uuid, '22222222-2222-2222-2222-222222220003'::uuid, 'refined_oil_cf',
   'Saurabh Arora — Current Manual Workflow',
   'Refined Oil Distribution / C&F Operations',
   'current_manual', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery']::text[]),

  ('22222222-2222-2222-2222-222222220011'::uuid,
   '22222222-2222-2222-2222-222222220002'::uuid, '22222222-2222-2222-2222-222222220003'::uuid, 'refined_oil_cf',
   'Saurabh Arora — Proposed ERP Workflow',
   'Refined Oil Distribution / C&F Operations',
   'proposed_erp', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery']::text[]),

  ('22222222-2222-2222-2222-222222220012'::uuid,
   '22222222-2222-2222-2222-222222220002'::uuid, '22222222-2222-2222-2222-222222220003'::uuid, 'refined_oil_cf',
   'Saurabh Arora — ERP + AI Workflow',
   'Refined Oil Distribution / C&F Operations',
   'erp_ai', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery','ERP + AI']::text[]),

  ('22222222-2222-2222-2222-222222220013'::uuid,
   '22222222-2222-2222-2222-222222220002'::uuid, '22222222-2222-2222-2222-222222220003'::uuid, 'refined_oil_cf',
   'Saurabh Arora — Workflow Canvas',
   'Refined Oil Distribution / C&F Operations',
   'combined', 'internal_review', 'shared_all',
   ARRAY['Actual Client','Partner Referral','Discovery','ERP + AI Workflow']::text[])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Current Manual nodes + edges
-- ---------------------------------------------------------------------------
INSERT INTO public.workflow_canvas_nodes (
  canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y
) VALUES
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.deal_booking', 'process', 'current_manual', 'management', 'shared_all', 'Purchase Deal Booking', 'Purchase Deal', NULL, ARRAY['MD / Management','Supplier / Company']::text[], 'MD negotiates rates with supplier/company and confirms the purchase deal with terms and conditions, currently shared through WhatsApp.', NULL, NULL, ARRAY['Deal terms scattered in WhatsApp','Weak approval trail','Rate, quantity, discount, and terms can be misread']::text[], ARRAY[]::text[], ARRAY['Deal confirmation','Terms note']::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 80, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.sheet_entry', 'process', 'current_manual', 'accounts', 'shared_all', 'Purchase Sheet Entry', NULL, NULL, ARRAY['Accounts']::text[], 'Accounts creates purchase deal sheet and enters it into existing software.', NULL, NULL, ARRAY['Duplicate entry','Manual dependency','Possibility of incorrect data entry']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 80, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.recheck', 'approval', 'current_manual', 'accounts', 'shared_all', 'Second-Level Recheck', NULL, NULL, ARRAY['Accounts']::text[], 'A second person rechecks details from WhatsApp, sheet, and software.', NULL, NULL, ARRAY['Time-consuming manual verification','Data exists in multiple places','No single source of truth']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 80, 360),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.dispatch_request', 'process', 'current_manual', 'commercial', 'shared_all', 'Dispatch Request to Supplier', NULL, NULL, ARRAY['Commercial Assistant','MD','Sales Team']::text[], 'Commercial assistant discusses stock requirement with sales team, gets MD approval, and sends dispatch request to supplier/company for plant/rake/CFA dispatch to own godown or direct party godown on bill-to-ship-to basis.', NULL, NULL, ARRAY['Manual coordination','Approval delays','Bill-to-ship-to tracking complexity']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'medium', NULL, NULL, 80, 500),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.supplier_invoice', 'document', 'current_manual', 'accounts', 'shared_all', 'Supplier Invoice Email', NULL, NULL, ARRAY['Accounts','Supplier']::text[], 'When stocks are billed and dispatched, the company sends an email. Accounts enters the invoice in software under Stock in Transit.', NULL, NULL, ARRAY['Manual invoice entry','Delayed stock visibility']::text[], ARRAY[]::text[], ARRAY['Supplier Invoice']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 80, 640),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.invoice_recon', 'process', 'current_manual', 'accounts', 'shared_all', 'Purchase Invoice Reconciliation', NULL, NULL, ARRAY['Accountant']::text[], 'Accountant checks invoice against booked rate, discounts, schemes, plant discount, rake discount, offers, and other terms.', NULL, NULL, ARRAY['Manual checking effort','Missed discounts','Delayed difference report']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 80, 780),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.truck_arrival', 'process', 'current_manual', 'depot_godown', 'shared_all', 'Truck Arrival Report', NULL, NULL, ARRAY['Depot / Godown Team']::text[], 'Depot shares truck arrival details with head office through WhatsApp.', NULL, NULL, ARRAY['WhatsApp dependency','Delayed visibility']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 360, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.goods_arrival', 'document', 'current_manual', 'depot_godown', 'shared_all', 'Goods Arrival Report', NULL, NULL, ARRAY['Godown Team']::text[], 'After unloading, godown team records quantity, fresh stock, damaged stock, leakage, wet/dented stock, oil loss, WMS/location, and prepares signed Goods Arrival Report.', NULL, NULL, ARRAY['Physical document dependency','Condition-wise stock update delayed','Damage/leakage claim delay risk']::text[], ARRAY[]::text[], ARRAY['Goods Arrival Report']::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 360, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.purchase.move_to_available', 'process', 'current_manual', 'head_office', 'shared_all', 'Move Stock — In Transit → Available', NULL, NULL, ARRAY['Head Office']::text[], 'Goods Arrival Report is shared with head office after finalization so stock can move from Stock in Transit to available stock.', NULL, NULL, ARRAY['Sales team may not have live saleable stock visibility','In-transit and saleable stock can be confused']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 360, 360),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.daily_rate', 'process', 'current_manual', 'management', 'shared_all', 'Daily Selling Rate', NULL, NULL, ARRAY['MD','Sales Heads','Sales Team']::text[], 'MD discusses market trend with sales heads and sales team and gives daily selling rates.', NULL, NULL, ARRAY['Informal rate communication','No version control']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'medium', NULL, NULL, 640, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.deal_booking', 'process', 'current_manual', 'sales', 'shared_all', 'Sales Deal Booking', NULL, NULL, ARRAY['Sales Team','Broker','Party']::text[], 'Price list is shared with brokers and parties. Offers are received through WhatsApp groups and confirmed or rejected by MD.', NULL, NULL, ARRAY['Offers scattered in WhatsApp','Rate/quantity disputes possible','Manual confirmation tracking']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 640, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.sheet_entry', 'process', 'current_manual', 'commercial', 'shared_all', 'Sales Sheet Entry', NULL, NULL, ARRAY['Commercial Assistant']::text[], 'Commercial assistant creates sales deal sheet and enters it in software.', NULL, NULL, ARRAY['Duplicate entry','Mismatch risk']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 640, 360),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.recheck', 'approval', 'current_manual', 'accounts', 'shared_all', 'Sales Entry Recheck', NULL, NULL, ARRAY['Accounts','Commercial']::text[], 'Second person rechecks from WhatsApp, sheet, and software.', NULL, NULL, ARRAY['Manual verification burden','No single source of truth']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 640, 500),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.dispatch_req', 'process', 'current_manual', 'commercial', 'shared_all', 'Dispatch Requirement Received', NULL, NULL, ARRAY['Commercial Assistant','Brokers','Parties','Sales Team']::text[], 'Commercial assistant receives loading/dispatch requirement from brokers, parties, or sales team.', NULL, NULL, ARRAY['Dispatch requests come from multiple sources','No structured allocation']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 920, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.credit_check', 'decision', 'current_manual', 'commercial', 'shared_all', 'Credit Limit & Overdue Check', NULL, NULL, ARRAY['Commercial Assistant','Accounts','Sales Head']::text[], 'Commercial assistant checks party limit, overdue, blocked status, and discusses dispatch with sales head.', NULL, NULL, ARRAY['Manual credit check','Risky dispatch if overdue not identified','Approval delay']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 920, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.sales.blocked_approval', 'approval', 'current_manual', 'management', 'shared_all', 'Blocked Party / Adhoc Approval', NULL, NULL, ARRAY['Management','Accounts']::text[], 'If required, approval for blocked party or adhoc credit is initiated through WhatsApp.', NULL, NULL, ARRAY['Informal approval trail','Delay in opening party']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'medium', NULL, NULL, 920, 360),
  ('22222222-2222-2222-2222-222222220010', 'current.dispatch.excel_program', 'document', 'current_manual', 'commercial', 'shared_all', 'Excel Dispatch Program', NULL, NULL, ARRAY['Commercial Assistant','Depot']::text[], 'If party is cleared, dispatch program is sent to depot on Excel via WhatsApp.', NULL, NULL, ARRAY['Excel dependency','Depot may not have latest changes']::text[], ARRAY[]::text[], ARRAY['Dispatch Program (Excel)']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 920, 500),
  ('22222222-2222-2222-2222-222222220010', 'current.dispatch.delivery_order', 'document', 'current_manual', 'depot_godown', 'shared_all', 'Delivery Order', NULL, NULL, ARRAY['Depot','Driver / Transporter']::text[], 'Depot arranges vehicle or party sends vehicle. Delivery Order is created and handed to driver.', NULL, NULL, ARRAY['Paper-based process','Vehicle and driver data not linked properly']::text[], ARRAY[]::text[], ARRAY['Delivery Order']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1200, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.dispatch.loading', 'process', 'current_manual', 'depot_godown', 'shared_all', 'Loading at Godown', NULL, NULL, ARRAY['Godown Incharge']::text[], 'Godown incharge loads vehicle, enters details in physical register, signs DO, and sends it back to office for billing.', NULL, NULL, ARRAY['Physical register dependency','Delayed billing trigger','Loading mismatch risk']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 1200, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.billing.invoice', 'process', 'current_manual', 'accounts', 'shared_all', 'Billing', NULL, NULL, ARRAY['Depot Accountant','Accounts']::text[], 'Depot accountant checks DO against loading program and initiates invoice. Bill-to-ship-to cases require same-day billing from BTST godown.', NULL, NULL, ARRAY['Manual document matching','Billing delay','Bill-to-ship-to tracking complexity']::text[], ARRAY[]::text[], ARRAY['Sales Invoice']::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 1480, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.billing.doc_recheck', 'document', 'current_manual', 'accounts', 'shared_all', 'Document Recheck & Vehicle Release', NULL, NULL, ARRAY['Office','Accounts Assistant']::text[], 'Invoices and documents are rechecked manually and handed to driver before vehicle leaves.', NULL, NULL, ARRAY['Missing document risk','Delayed vehicle release']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1480, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.billing.pod', 'document', 'current_manual', 'head_office', 'shared_all', 'Delivery Receiving / POD', NULL, NULL, ARRAY['Depot Office','Head Office']::text[], 'After delivery, depot office checks receiving and records delivery. Issues are escalated to head office.', NULL, NULL, ARRAY['POD tracking is manual','Issue escalation delayed']::text[], ARRAY[]::text[], ARRAY['POD','Receiving Copy']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1480, 360),
  ('22222222-2222-2222-2222-222222220010', 'current.freight.entry', 'process', 'current_manual', 'accounts', 'shared_all', 'Freight Entry', NULL, NULL, ARRAY['Depot Accountant']::text[], 'Depot accountant enters daily freight entries.', NULL, NULL, ARRAY['Freight not always linked to transaction, vehicle, route, and invoice']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1760, 80),
  ('22222222-2222-2222-2222-222222220010', 'current.freight.cash_closing', 'process', 'current_manual', 'accounts', 'shared_all', 'Cash Closing', NULL, NULL, ARRAY['Office','Accounts Assistant']::text[], 'Daily cash records are updated, printed, signed, and sent through WhatsApp to head office.', NULL, NULL, ARRAY['Manual closing','WhatsApp reporting','Delayed reconciliation']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 1760, 220),
  ('22222222-2222-2222-2222-222222220010', 'current.freight.head_office_recon', 'process', 'current_manual', 'head_office', 'shared_all', 'Head Office Reconciliation', NULL, NULL, ARRAY['Head Office','Sales / Commercial']::text[], 'Head office gets BTST documents and receiving from parties through sales/commercial team help.', NULL, NULL, ARRAY['Follow-up dependency','Missing documents','Delayed closure']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1760, 360)
ON CONFLICT (canvas_id, node_key) DO NOTHING;

INSERT INTO public.workflow_canvas_edges (
  canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition
) VALUES
  ('22222222-2222-2222-2222-222222220010', 'current.e1', 'current.purchase.deal_booking', 'current.purchase.sheet_entry', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e2', 'current.purchase.sheet_entry', 'current.purchase.recheck', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e3', 'current.purchase.recheck', 'current.purchase.dispatch_request', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e4', 'current.purchase.dispatch_request', 'current.purchase.supplier_invoice', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e5', 'current.purchase.supplier_invoice', 'current.purchase.invoice_recon', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e6', 'current.purchase.invoice_recon', 'current.purchase.truck_arrival', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e7', 'current.purchase.truck_arrival', 'current.purchase.goods_arrival', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e8', 'current.purchase.goods_arrival', 'current.purchase.move_to_available', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e9', 'current.sales.daily_rate', 'current.sales.deal_booking', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e10', 'current.sales.deal_booking', 'current.sales.sheet_entry', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e11', 'current.sales.sheet_entry', 'current.sales.recheck', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e12', 'current.sales.recheck', 'current.sales.dispatch_req', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e13', 'current.sales.dispatch_req', 'current.sales.credit_check', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e14', 'current.sales.credit_check', 'current.sales.blocked_approval', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e15', 'current.sales.credit_check', 'current.dispatch.excel_program', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e16', 'current.sales.blocked_approval', 'current.dispatch.excel_program', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e17', 'current.dispatch.excel_program', 'current.dispatch.delivery_order', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e18', 'current.dispatch.delivery_order', 'current.dispatch.loading', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e19', 'current.dispatch.loading', 'current.billing.invoice', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e20', 'current.billing.invoice', 'current.billing.doc_recheck', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e21', 'current.billing.doc_recheck', 'current.billing.pod', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e22', 'current.billing.pod', 'current.freight.entry', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e23', 'current.freight.entry', 'current.freight.cash_closing', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220010', 'current.e24', 'current.freight.cash_closing', 'current.freight.head_office_recon', 'normal', 'current_manual', 'shared_all', NULL, NULL)
ON CONFLICT (canvas_id, edge_key) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 6. Proposed ERP nodes + edges
-- ---------------------------------------------------------------------------
INSERT INTO public.workflow_canvas_nodes (
  canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y
) VALUES
  ('22222222-2222-2222-2222-222222220011', 'erp.purchase.deal_booking', 'process', 'proposed_erp', 'system', 'shared_all', 'Purchase Deal Booking', NULL, NULL, ARRAY[]::text[], NULL, 'Create Purchase Deal Booking with supplier, product, quantity, booked rate, terms, discount, scheme, delivery point, validity, and approval status.', NULL, ARRAY[]::text[], ARRAY['Purchase Management']::text[], ARRAY[]::text[], ARRAY['Supplier','Product','Quantity','Booked Rate','Terms','Discount','Scheme','Delivery Point','Validity']::text[], NULL, 'high', NULL, NULL, 80, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.purchase.approval_trail', 'approval', 'proposed_erp', 'system', 'shared_all', 'Approval Trail', NULL, NULL, ARRAY[]::text[], NULL, 'All deal approvals are recorded with user, timestamp, comments, and version history.', NULL, ARRAY[]::text[], ARRAY['Purchase Management','Approval Workflow']::text[], ARRAY[]::text[], ARRAY['User','Timestamp','Comments','Version']::text[], NULL, 'high', NULL, NULL, 80, 1240),
  ('22222222-2222-2222-2222-222222220011', 'erp.purchase.invoice_import', 'system', 'proposed_erp', 'system', 'shared_all', 'Purchase Invoice Import', NULL, NULL, ARRAY[]::text[], NULL, 'Supplier invoice creates Stock in Transit and links to Purchase Deal.', NULL, ARRAY[]::text[], ARRAY['Purchase Management','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 1380),
  ('22222222-2222-2222-2222-222222220011', 'erp.purchase.invoice_recon', 'system', 'proposed_erp', 'system', 'shared_all', 'Invoice Reconciliation', NULL, NULL, ARRAY[]::text[], NULL, 'System compares invoice against booked rate, quantity, discounts, schemes, and terms.', NULL, ARRAY[]::text[], ARRAY['Purchase Management']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 1520),
  ('22222222-2222-2222-2222-222222220011', 'erp.inventory.goods_arrival', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'Goods Arrival Report', NULL, NULL, ARRAY[]::text[], NULL, 'Mobile Goods Arrival Report captures received quantity, condition-wise stock, batch, godown, WMS/location, and driver confirmation.', NULL, ARRAY[]::text[], ARRAY['Inventory','Mobile App']::text[], ARRAY['Goods Arrival Report']::text[], ARRAY['Received Quantity','Condition-wise Stock','Batch','Godown','WMS Location','Driver Confirmation']::text[], NULL, 'high', NULL, NULL, 360, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.inventory.condition_wise', 'data', 'proposed_erp', 'system', 'shared_all', 'Condition-wise Inventory', NULL, NULL, ARRAY[]::text[], NULL, 'Stock moves automatically into Available, Damaged, Wet/Dented, Leakage, or Loose locations.', NULL, ARRAY[]::text[], ARRAY['Inventory','Godown Management']::text[], ARRAY[]::text[], ARRAY['Available','Damaged','Wet/Dented','Leakage','Loose']::text[], NULL, 'high', NULL, NULL, 360, 1240),
  ('22222222-2222-2222-2222-222222220011', 'erp.sales.deal_booking', 'process', 'proposed_erp', 'sales', 'shared_all', 'Sales Deal Booking', NULL, NULL, ARRAY[]::text[], NULL, 'Sales Deal Booking captures party, broker, product, rate, quantity, discount, terms, validity, and approval.', NULL, ARRAY[]::text[], ARRAY['Sales','Deal Booking Management']::text[], ARRAY[]::text[], ARRAY['Party','Broker','Product','Rate','Quantity','Discount','Terms','Validity','Approval']::text[], NULL, 'high', NULL, NULL, 640, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.sales.credit_check', 'decision', 'proposed_erp', 'system', 'shared_all', 'Automated Credit Check', NULL, NULL, ARRAY[]::text[], NULL, 'ERP checks credit limit, overdue, blocked status, due days, deal limit, and adhoc approval requirement.', NULL, ARRAY[]::text[], ARRAY['Credit Control','Sales']::text[], ARRAY[]::text[], ARRAY['Credit Limit','Overdue','Blocked Status','Due Days','Deal Limit','Adhoc Approval']::text[], NULL, 'high', NULL, NULL, 920, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.dispatch.program', 'system', 'proposed_erp', 'system', 'shared_all', 'Dispatch Program', NULL, NULL, ARRAY[]::text[], NULL, 'System generates dispatch program linked to approved Sales Deal and available stock.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Sales','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 920, 1240),
  ('22222222-2222-2222-2222-222222220011', 'erp.dispatch.delivery_order', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'Delivery Order', NULL, NULL, ARRAY[]::text[], NULL, 'Delivery Order is generated with vehicle, driver, transporter, product, batch, quantity, and destination.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Documents']::text[], ARRAY['Delivery Order']::text[], ARRAY['Vehicle','Driver','Transporter','Product','Batch','Quantity','Destination']::text[], NULL, 'high', NULL, NULL, 1200, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.dispatch.loading_confirm', 'process', 'proposed_erp', 'depot_godown', 'shared_all', 'Mobile Loading Confirmation', NULL, NULL, ARRAY[]::text[], NULL, 'Godown confirms loading through mobile with batch, quantity, condition, vehicle, timestamp, and user confirmation.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Mobile App']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1200, 1240),
  ('22222222-2222-2222-2222-222222220011', 'erp.billing.invoice_trigger', 'system', 'proposed_erp', 'system', 'shared_all', 'Invoice Trigger', NULL, NULL, ARRAY[]::text[], NULL, 'Invoice is triggered after loading confirmation. Bill-to-ship-to rules are supported.', NULL, ARRAY[]::text[], ARRAY['Billing','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.billing.doc_checklist', 'document', 'proposed_erp', 'system', 'shared_all', 'Document Checklist', NULL, NULL, ARRAY[]::text[], NULL, 'System checks required invoice, DO, e-way bill, POD, and receiving documents.', NULL, ARRAY[]::text[], ARRAY['Documents','Billing']::text[], ARRAY['Invoice','DO','E-way Bill','POD','Receiving']::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1240),
  ('22222222-2222-2222-2222-222222220011', 'erp.billing.pod_upload', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'POD & Receiving Upload', NULL, NULL, ARRAY[]::text[], NULL, 'POD and receiving copy are uploaded and linked to invoice/order.', NULL, ARRAY[]::text[], ARRAY['Documents','Mobile App']::text[], ARRAY['POD','Receiving Copy']::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1380),
  ('22222222-2222-2222-2222-222222220011', 'erp.freight.management', 'process', 'proposed_erp', 'accounts', 'shared_all', 'Freight Management', NULL, NULL, ARRAY[]::text[], NULL, 'Freight is linked to vehicle, transporter, route, invoice, party, and dispatch.', NULL, ARRAY[]::text[], ARRAY['Freight']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1100),
  ('22222222-2222-2222-2222-222222220011', 'erp.freight.cash_closing', 'process', 'proposed_erp', 'accounts', 'shared_all', 'Digital Cash Closing', NULL, NULL, ARRAY[]::text[], NULL, 'Cash closing is entered, approved, and visible to head office digitally.', NULL, ARRAY[]::text[], ARRAY['Cash Management','Accounts']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1240),
  ('22222222-2222-2222-2222-222222220011', 'erp.dashboard.management', 'system', 'proposed_erp', 'management', 'shared_all', 'Management Dashboard', NULL, NULL, ARRAY[]::text[], NULL, 'Dashboard shows exceptions, pending approvals, in-transit stock, pending billing, POD pending, freight pending, cash closing pending, and margin leakage.', NULL, ARRAY[]::text[], ARRAY['Dashboard','Decision Intelligence']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1380)
ON CONFLICT (canvas_id, node_key) DO NOTHING;

INSERT INTO public.workflow_canvas_edges (
  canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition
) VALUES
  ('22222222-2222-2222-2222-222222220011', 'erp.e1', 'erp.purchase.deal_booking', 'erp.purchase.approval_trail', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e2', 'erp.purchase.approval_trail', 'erp.purchase.invoice_import', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e3', 'erp.purchase.invoice_import', 'erp.purchase.invoice_recon', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e4', 'erp.purchase.invoice_recon', 'erp.inventory.goods_arrival', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e5', 'erp.inventory.goods_arrival', 'erp.inventory.condition_wise', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e6', 'erp.inventory.condition_wise', 'erp.sales.deal_booking', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e7', 'erp.sales.deal_booking', 'erp.sales.credit_check', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e8', 'erp.sales.credit_check', 'erp.dispatch.program', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e9', 'erp.dispatch.program', 'erp.dispatch.delivery_order', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e10', 'erp.dispatch.delivery_order', 'erp.dispatch.loading_confirm', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e11', 'erp.dispatch.loading_confirm', 'erp.billing.invoice_trigger', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e12', 'erp.billing.invoice_trigger', 'erp.billing.doc_checklist', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e13', 'erp.billing.doc_checklist', 'erp.billing.pod_upload', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e14', 'erp.billing.pod_upload', 'erp.freight.management', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e15', 'erp.freight.management', 'erp.freight.cash_closing', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220011', 'erp.e16', 'erp.freight.cash_closing', 'erp.dashboard.management', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL)
ON CONFLICT (canvas_id, edge_key) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 7. ERP + AI nodes + edges (AI nodes here, plus all ERP nodes for context)
-- ---------------------------------------------------------------------------
INSERT INTO public.workflow_canvas_nodes (
  canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y
) VALUES
  ('22222222-2222-2222-2222-222222220012', 'erp.purchase.deal_booking', 'process', 'proposed_erp', 'system', 'shared_all', 'Purchase Deal Booking', NULL, NULL, ARRAY[]::text[], NULL, 'Create Purchase Deal Booking with supplier, product, quantity, booked rate, terms, discount, scheme, delivery point, validity, and approval status.', NULL, ARRAY[]::text[], ARRAY['Purchase Management']::text[], ARRAY[]::text[], ARRAY['Supplier','Product','Quantity','Booked Rate','Terms','Discount','Scheme','Delivery Point','Validity']::text[], NULL, 'high', NULL, NULL, 80, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.purchase.approval_trail', 'approval', 'proposed_erp', 'system', 'shared_all', 'Approval Trail', NULL, NULL, ARRAY[]::text[], NULL, 'All deal approvals are recorded with user, timestamp, comments, and version history.', NULL, ARRAY[]::text[], ARRAY['Purchase Management','Approval Workflow']::text[], ARRAY[]::text[], ARRAY['User','Timestamp','Comments','Version']::text[], NULL, 'high', NULL, NULL, 80, 1240),
  ('22222222-2222-2222-2222-222222220012', 'erp.purchase.invoice_import', 'system', 'proposed_erp', 'system', 'shared_all', 'Purchase Invoice Import', NULL, NULL, ARRAY[]::text[], NULL, 'Supplier invoice creates Stock in Transit and links to Purchase Deal.', NULL, ARRAY[]::text[], ARRAY['Purchase Management','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 1380),
  ('22222222-2222-2222-2222-222222220012', 'erp.purchase.invoice_recon', 'system', 'proposed_erp', 'system', 'shared_all', 'Invoice Reconciliation', NULL, NULL, ARRAY[]::text[], NULL, 'System compares invoice against booked rate, quantity, discounts, schemes, and terms.', NULL, ARRAY[]::text[], ARRAY['Purchase Management']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 1520),
  ('22222222-2222-2222-2222-222222220012', 'erp.inventory.goods_arrival', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'Goods Arrival Report', NULL, NULL, ARRAY[]::text[], NULL, 'Mobile Goods Arrival Report captures received quantity, condition-wise stock, batch, godown, WMS/location, and driver confirmation.', NULL, ARRAY[]::text[], ARRAY['Inventory','Mobile App']::text[], ARRAY['Goods Arrival Report']::text[], ARRAY['Received Quantity','Condition-wise Stock','Batch','Godown','WMS Location','Driver Confirmation']::text[], NULL, 'high', NULL, NULL, 360, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.inventory.condition_wise', 'data', 'proposed_erp', 'system', 'shared_all', 'Condition-wise Inventory', NULL, NULL, ARRAY[]::text[], NULL, 'Stock moves automatically into Available, Damaged, Wet/Dented, Leakage, or Loose locations.', NULL, ARRAY[]::text[], ARRAY['Inventory','Godown Management']::text[], ARRAY[]::text[], ARRAY['Available','Damaged','Wet/Dented','Leakage','Loose']::text[], NULL, 'high', NULL, NULL, 360, 1240),
  ('22222222-2222-2222-2222-222222220012', 'erp.sales.deal_booking', 'process', 'proposed_erp', 'sales', 'shared_all', 'Sales Deal Booking', NULL, NULL, ARRAY[]::text[], NULL, 'Sales Deal Booking captures party, broker, product, rate, quantity, discount, terms, validity, and approval.', NULL, ARRAY[]::text[], ARRAY['Sales','Deal Booking Management']::text[], ARRAY[]::text[], ARRAY['Party','Broker','Product','Rate','Quantity','Discount','Terms','Validity','Approval']::text[], NULL, 'high', NULL, NULL, 640, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.sales.credit_check', 'decision', 'proposed_erp', 'system', 'shared_all', 'Automated Credit Check', NULL, NULL, ARRAY[]::text[], NULL, 'ERP checks credit limit, overdue, blocked status, due days, deal limit, and adhoc approval requirement.', NULL, ARRAY[]::text[], ARRAY['Credit Control','Sales']::text[], ARRAY[]::text[], ARRAY['Credit Limit','Overdue','Blocked Status','Due Days','Deal Limit','Adhoc Approval']::text[], NULL, 'high', NULL, NULL, 920, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.dispatch.program', 'system', 'proposed_erp', 'system', 'shared_all', 'Dispatch Program', NULL, NULL, ARRAY[]::text[], NULL, 'System generates dispatch program linked to approved Sales Deal and available stock.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Sales','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 920, 1240),
  ('22222222-2222-2222-2222-222222220012', 'erp.dispatch.delivery_order', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'Delivery Order', NULL, NULL, ARRAY[]::text[], NULL, 'Delivery Order is generated with vehicle, driver, transporter, product, batch, quantity, and destination.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Documents']::text[], ARRAY['Delivery Order']::text[], ARRAY['Vehicle','Driver','Transporter','Product','Batch','Quantity','Destination']::text[], NULL, 'high', NULL, NULL, 1200, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.dispatch.loading_confirm', 'process', 'proposed_erp', 'depot_godown', 'shared_all', 'Mobile Loading Confirmation', NULL, NULL, ARRAY[]::text[], NULL, 'Godown confirms loading through mobile with batch, quantity, condition, vehicle, timestamp, and user confirmation.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Mobile App']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1200, 1240),
  ('22222222-2222-2222-2222-222222220012', 'erp.billing.invoice_trigger', 'system', 'proposed_erp', 'system', 'shared_all', 'Invoice Trigger', NULL, NULL, ARRAY[]::text[], NULL, 'Invoice is triggered after loading confirmation. Bill-to-ship-to rules are supported.', NULL, ARRAY[]::text[], ARRAY['Billing','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.billing.doc_checklist', 'document', 'proposed_erp', 'system', 'shared_all', 'Document Checklist', NULL, NULL, ARRAY[]::text[], NULL, 'System checks required invoice, DO, e-way bill, POD, and receiving documents.', NULL, ARRAY[]::text[], ARRAY['Documents','Billing']::text[], ARRAY['Invoice','DO','E-way Bill','POD','Receiving']::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1240),
  ('22222222-2222-2222-2222-222222220012', 'erp.billing.pod_upload', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'POD & Receiving Upload', NULL, NULL, ARRAY[]::text[], NULL, 'POD and receiving copy are uploaded and linked to invoice/order.', NULL, ARRAY[]::text[], ARRAY['Documents','Mobile App']::text[], ARRAY['POD','Receiving Copy']::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1380),
  ('22222222-2222-2222-2222-222222220012', 'erp.freight.management', 'process', 'proposed_erp', 'accounts', 'shared_all', 'Freight Management', NULL, NULL, ARRAY[]::text[], NULL, 'Freight is linked to vehicle, transporter, route, invoice, party, and dispatch.', NULL, ARRAY[]::text[], ARRAY['Freight']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1100),
  ('22222222-2222-2222-2222-222222220012', 'erp.freight.cash_closing', 'process', 'proposed_erp', 'accounts', 'shared_all', 'Digital Cash Closing', NULL, NULL, ARRAY[]::text[], NULL, 'Cash closing is entered, approved, and visible to head office digitally.', NULL, ARRAY[]::text[], ARRAY['Cash Management','Accounts']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1240),
  ('22222222-2222-2222-2222-222222220012', 'erp.dashboard.management', 'system', 'proposed_erp', 'management', 'shared_all', 'Management Dashboard', NULL, NULL, ARRAY[]::text[], NULL, 'Dashboard shows exceptions, pending approvals, in-transit stock, pending billing, POD pending, freight pending, cash closing pending, and margin leakage.', NULL, ARRAY[]::text[], ARRAY['Dashboard','Decision Intelligence']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1380)
ON CONFLICT (canvas_id, node_key) DO NOTHING;

INSERT INTO public.workflow_canvas_nodes (
  canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y
) VALUES
  ('22222222-2222-2222-2222-222222220012', 'ai.whatsapp_extraction', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'WhatsApp-to-ERP Extraction', NULL, 'Extract Purchase Deal, Sales Deal, approvals, dispatch requests, and rate confirmations from WhatsApp-style messages or uploaded screenshots.', ARRAY[]::text[], NULL, NULL, 'Eliminates the WhatsApp dependency that creates the largest single source of operational friction.', ARRAY[]::text[], ARRAY['AI Layer','Purchase','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 2100),
  ('22222222-2222-2222-2222-222222220012', 'ai.invoice_matching', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Invoice Matching Assistant', NULL, 'Compare supplier invoice with Purchase Deal terms, discounts, schemes, plant discount, rake discount, offers, quantity, and rate.', ARRAY[]::text[], NULL, NULL, 'Catches missed discounts and plant/rake scheme leakage automatically.', ARRAY[]::text[], ARRAY['AI Layer','Purchase Management']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 2240),
  ('22222222-2222-2222-2222-222222220012', 'ai.credit_risk_alert', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Credit Risk Alert', NULL, 'Warn before dispatch if party is overdue, blocked, near credit limit, or has risky payment behavior.', ARRAY[]::text[], NULL, NULL, 'Pre-empts risky dispatches before they leave the godown.', ARRAY[]::text[], ARRAY['AI Layer','Credit Control']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 920, 2100),
  ('22222222-2222-2222-2222-222222220012', 'ai.goods_arrival_ocr', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Goods Arrival OCR', NULL, 'Read signed Goods Arrival Report and identify missing fields, quantity mismatch, damage/leakage, and oil loss.', ARRAY[]::text[], NULL, NULL, 'Speeds up condition-wise stock posting; catches damage/leakage claims earlier.', ARRAY[]::text[], ARRAY['AI Layer','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 360, 2100),
  ('22222222-2222-2222-2222-222222220012', 'ai.document_ocr', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Document OCR & Checklist', NULL, 'Verify invoice, Delivery Order, e-way bill, POD, and receiving copy.', ARRAY[]::text[], NULL, NULL, 'Removes the manual document recheck step before vehicle release.', ARRAY[]::text[], ARRAY['AI Layer','Documents']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 2100),
  ('22222222-2222-2222-2222-222222220012', 'ai.smart_stock_assistant', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Smart Stock Assistant', NULL, 'Answer stock questions by godown, batch, condition, in-transit status, reserved quantity, and saleable quantity.', ARRAY[]::text[], NULL, NULL, 'Conversational layer over inventory — sales team self-serves stock visibility.', ARRAY[]::text[], ARRAY['AI Layer','Inventory','Decision Intelligence']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 640, 2100),
  ('22222222-2222-2222-2222-222222220012', 'ai.margin_leakage', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Margin Leakage Detection', NULL, 'Detect low-margin or loss-making transactions after considering purchase rate, sales rate, discount, scheme, freight, oil loss, and damage.', ARRAY[]::text[], NULL, NULL, 'Quantifies the cost of operational shortfalls and ranks fixable transactions by margin impact.', ARRAY[]::text[], ARRAY['AI Layer','Decision Intelligence','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 2100),
  ('22222222-2222-2222-2222-222222220012', 'ai.exception_dashboard', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Exception Dashboard', NULL, 'Highlight operational exceptions requiring management attention.', ARRAY[]::text[], NULL, NULL, 'Single pane for management — what to look at first, with explainability.', ARRAY[]::text[], ARRAY['AI Layer','Dashboard']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 2240)
ON CONFLICT (canvas_id, node_key) DO NOTHING;

INSERT INTO public.workflow_canvas_edges (
  canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition
) VALUES
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e1', 'erp.purchase.deal_booking', 'erp.purchase.approval_trail', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e2', 'erp.purchase.approval_trail', 'erp.purchase.invoice_import', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e3', 'erp.purchase.invoice_import', 'erp.purchase.invoice_recon', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e4', 'erp.purchase.invoice_recon', 'erp.inventory.goods_arrival', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e5', 'erp.inventory.goods_arrival', 'erp.inventory.condition_wise', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e6', 'erp.inventory.condition_wise', 'erp.sales.deal_booking', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e7', 'erp.sales.deal_booking', 'erp.sales.credit_check', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e8', 'erp.sales.credit_check', 'erp.dispatch.program', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e9', 'erp.dispatch.program', 'erp.dispatch.delivery_order', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e10', 'erp.dispatch.delivery_order', 'erp.dispatch.loading_confirm', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e11', 'erp.dispatch.loading_confirm', 'erp.billing.invoice_trigger', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e12', 'erp.billing.invoice_trigger', 'erp.billing.doc_checklist', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e13', 'erp.billing.doc_checklist', 'erp.billing.pod_upload', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e14', 'erp.billing.pod_upload', 'erp.freight.management', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e15', 'erp.freight.management', 'erp.freight.cash_closing', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai_ctx.erp.e16', 'erp.freight.cash_closing', 'erp.dashboard.management', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL)
ON CONFLICT (canvas_id, edge_key) DO NOTHING;

INSERT INTO public.workflow_canvas_edges (
  canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition
) VALUES
  ('22222222-2222-2222-2222-222222220012', 'ai.e1', 'ai.whatsapp_extraction', 'erp.purchase.deal_booking', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e2', 'ai.whatsapp_extraction', 'erp.sales.deal_booking', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e3', 'ai.whatsapp_extraction', 'erp.purchase.approval_trail', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e4', 'ai.whatsapp_extraction', 'erp.dispatch.program', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e5', 'ai.invoice_matching', 'erp.purchase.invoice_import', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e6', 'ai.invoice_matching', 'erp.purchase.invoice_recon', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e7', 'ai.credit_risk_alert', 'erp.sales.credit_check', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e8', 'ai.goods_arrival_ocr', 'erp.inventory.goods_arrival', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e9', 'ai.goods_arrival_ocr', 'erp.inventory.condition_wise', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e10', 'ai.document_ocr', 'erp.billing.doc_checklist', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e11', 'ai.document_ocr', 'erp.billing.pod_upload', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e12', 'ai.smart_stock_assistant', 'erp.inventory.condition_wise', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e13', 'ai.smart_stock_assistant', 'erp.dashboard.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e14', 'ai.margin_leakage', 'erp.sales.deal_booking', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e15', 'ai.margin_leakage', 'erp.freight.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e16', 'ai.margin_leakage', 'erp.dashboard.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220012', 'ai.e17', 'ai.exception_dashboard', 'erp.dashboard.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL)
ON CONFLICT (canvas_id, edge_key) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 8. Combined canvas — every node, every edge
-- ---------------------------------------------------------------------------
INSERT INTO public.workflow_canvas_nodes (
  canvas_id, node_key, node_type, phase, department, visibility,
  title, short_label, description, actors,
  current_process, proposed_process, ai_opportunity,
  pain_points, erp_modules, documents, data_captured,
  risk_level, automation_potential, internal_notes, client_notes,
  position_x, position_y
) VALUES
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.deal_booking', 'process', 'current_manual', 'management', 'shared_all', 'Purchase Deal Booking', 'Purchase Deal', NULL, ARRAY['MD / Management','Supplier / Company']::text[], 'MD negotiates rates with supplier/company and confirms the purchase deal with terms and conditions, currently shared through WhatsApp.', NULL, NULL, ARRAY['Deal terms scattered in WhatsApp','Weak approval trail','Rate, quantity, discount, and terms can be misread']::text[], ARRAY[]::text[], ARRAY['Deal confirmation','Terms note']::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 80, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.sheet_entry', 'process', 'current_manual', 'accounts', 'shared_all', 'Purchase Sheet Entry', NULL, NULL, ARRAY['Accounts']::text[], 'Accounts creates purchase deal sheet and enters it into existing software.', NULL, NULL, ARRAY['Duplicate entry','Manual dependency','Possibility of incorrect data entry']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 80, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.recheck', 'approval', 'current_manual', 'accounts', 'shared_all', 'Second-Level Recheck', NULL, NULL, ARRAY['Accounts']::text[], 'A second person rechecks details from WhatsApp, sheet, and software.', NULL, NULL, ARRAY['Time-consuming manual verification','Data exists in multiple places','No single source of truth']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 80, 360),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.dispatch_request', 'process', 'current_manual', 'commercial', 'shared_all', 'Dispatch Request to Supplier', NULL, NULL, ARRAY['Commercial Assistant','MD','Sales Team']::text[], 'Commercial assistant discusses stock requirement with sales team, gets MD approval, and sends dispatch request to supplier/company for plant/rake/CFA dispatch to own godown or direct party godown on bill-to-ship-to basis.', NULL, NULL, ARRAY['Manual coordination','Approval delays','Bill-to-ship-to tracking complexity']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'medium', NULL, NULL, 80, 500),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.supplier_invoice', 'document', 'current_manual', 'accounts', 'shared_all', 'Supplier Invoice Email', NULL, NULL, ARRAY['Accounts','Supplier']::text[], 'When stocks are billed and dispatched, the company sends an email. Accounts enters the invoice in software under Stock in Transit.', NULL, NULL, ARRAY['Manual invoice entry','Delayed stock visibility']::text[], ARRAY[]::text[], ARRAY['Supplier Invoice']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 80, 640),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.invoice_recon', 'process', 'current_manual', 'accounts', 'shared_all', 'Purchase Invoice Reconciliation', NULL, NULL, ARRAY['Accountant']::text[], 'Accountant checks invoice against booked rate, discounts, schemes, plant discount, rake discount, offers, and other terms.', NULL, NULL, ARRAY['Manual checking effort','Missed discounts','Delayed difference report']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 80, 780),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.truck_arrival', 'process', 'current_manual', 'depot_godown', 'shared_all', 'Truck Arrival Report', NULL, NULL, ARRAY['Depot / Godown Team']::text[], 'Depot shares truck arrival details with head office through WhatsApp.', NULL, NULL, ARRAY['WhatsApp dependency','Delayed visibility']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 360, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.goods_arrival', 'document', 'current_manual', 'depot_godown', 'shared_all', 'Goods Arrival Report', NULL, NULL, ARRAY['Godown Team']::text[], 'After unloading, godown team records quantity, fresh stock, damaged stock, leakage, wet/dented stock, oil loss, WMS/location, and prepares signed Goods Arrival Report.', NULL, NULL, ARRAY['Physical document dependency','Condition-wise stock update delayed','Damage/leakage claim delay risk']::text[], ARRAY[]::text[], ARRAY['Goods Arrival Report']::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 360, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.purchase.move_to_available', 'process', 'current_manual', 'head_office', 'shared_all', 'Move Stock — In Transit → Available', NULL, NULL, ARRAY['Head Office']::text[], 'Goods Arrival Report is shared with head office after finalization so stock can move from Stock in Transit to available stock.', NULL, NULL, ARRAY['Sales team may not have live saleable stock visibility','In-transit and saleable stock can be confused']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 360, 360),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.daily_rate', 'process', 'current_manual', 'management', 'shared_all', 'Daily Selling Rate', NULL, NULL, ARRAY['MD','Sales Heads','Sales Team']::text[], 'MD discusses market trend with sales heads and sales team and gives daily selling rates.', NULL, NULL, ARRAY['Informal rate communication','No version control']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'medium', NULL, NULL, 640, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.deal_booking', 'process', 'current_manual', 'sales', 'shared_all', 'Sales Deal Booking', NULL, NULL, ARRAY['Sales Team','Broker','Party']::text[], 'Price list is shared with brokers and parties. Offers are received through WhatsApp groups and confirmed or rejected by MD.', NULL, NULL, ARRAY['Offers scattered in WhatsApp','Rate/quantity disputes possible','Manual confirmation tracking']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 640, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.sheet_entry', 'process', 'current_manual', 'commercial', 'shared_all', 'Sales Sheet Entry', NULL, NULL, ARRAY['Commercial Assistant']::text[], 'Commercial assistant creates sales deal sheet and enters it in software.', NULL, NULL, ARRAY['Duplicate entry','Mismatch risk']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 640, 360),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.recheck', 'approval', 'current_manual', 'accounts', 'shared_all', 'Sales Entry Recheck', NULL, NULL, ARRAY['Accounts','Commercial']::text[], 'Second person rechecks from WhatsApp, sheet, and software.', NULL, NULL, ARRAY['Manual verification burden','No single source of truth']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 640, 500),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.dispatch_req', 'process', 'current_manual', 'commercial', 'shared_all', 'Dispatch Requirement Received', NULL, NULL, ARRAY['Commercial Assistant','Brokers','Parties','Sales Team']::text[], 'Commercial assistant receives loading/dispatch requirement from brokers, parties, or sales team.', NULL, NULL, ARRAY['Dispatch requests come from multiple sources','No structured allocation']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 920, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.credit_check', 'decision', 'current_manual', 'commercial', 'shared_all', 'Credit Limit & Overdue Check', NULL, NULL, ARRAY['Commercial Assistant','Accounts','Sales Head']::text[], 'Commercial assistant checks party limit, overdue, blocked status, and discusses dispatch with sales head.', NULL, NULL, ARRAY['Manual credit check','Risky dispatch if overdue not identified','Approval delay']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 920, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.sales.blocked_approval', 'approval', 'current_manual', 'management', 'shared_all', 'Blocked Party / Adhoc Approval', NULL, NULL, ARRAY['Management','Accounts']::text[], 'If required, approval for blocked party or adhoc credit is initiated through WhatsApp.', NULL, NULL, ARRAY['Informal approval trail','Delay in opening party']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'medium', NULL, NULL, 920, 360),
  ('22222222-2222-2222-2222-222222220013', 'current.dispatch.excel_program', 'document', 'current_manual', 'commercial', 'shared_all', 'Excel Dispatch Program', NULL, NULL, ARRAY['Commercial Assistant','Depot']::text[], 'If party is cleared, dispatch program is sent to depot on Excel via WhatsApp.', NULL, NULL, ARRAY['Excel dependency','Depot may not have latest changes']::text[], ARRAY[]::text[], ARRAY['Dispatch Program (Excel)']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 920, 500),
  ('22222222-2222-2222-2222-222222220013', 'current.dispatch.delivery_order', 'document', 'current_manual', 'depot_godown', 'shared_all', 'Delivery Order', NULL, NULL, ARRAY['Depot','Driver / Transporter']::text[], 'Depot arranges vehicle or party sends vehicle. Delivery Order is created and handed to driver.', NULL, NULL, ARRAY['Paper-based process','Vehicle and driver data not linked properly']::text[], ARRAY[]::text[], ARRAY['Delivery Order']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1200, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.dispatch.loading', 'process', 'current_manual', 'depot_godown', 'shared_all', 'Loading at Godown', NULL, NULL, ARRAY['Godown Incharge']::text[], 'Godown incharge loads vehicle, enters details in physical register, signs DO, and sends it back to office for billing.', NULL, NULL, ARRAY['Physical register dependency','Delayed billing trigger','Loading mismatch risk']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 1200, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.billing.invoice', 'process', 'current_manual', 'accounts', 'shared_all', 'Billing', NULL, NULL, ARRAY['Depot Accountant','Accounts']::text[], 'Depot accountant checks DO against loading program and initiates invoice. Bill-to-ship-to cases require same-day billing from BTST godown.', NULL, NULL, ARRAY['Manual document matching','Billing delay','Bill-to-ship-to tracking complexity']::text[], ARRAY[]::text[], ARRAY['Sales Invoice']::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 1480, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.billing.doc_recheck', 'document', 'current_manual', 'accounts', 'shared_all', 'Document Recheck & Vehicle Release', NULL, NULL, ARRAY['Office','Accounts Assistant']::text[], 'Invoices and documents are rechecked manually and handed to driver before vehicle leaves.', NULL, NULL, ARRAY['Missing document risk','Delayed vehicle release']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1480, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.billing.pod', 'document', 'current_manual', 'head_office', 'shared_all', 'Delivery Receiving / POD', NULL, NULL, ARRAY['Depot Office','Head Office']::text[], 'After delivery, depot office checks receiving and records delivery. Issues are escalated to head office.', NULL, NULL, ARRAY['POD tracking is manual','Issue escalation delayed']::text[], ARRAY[]::text[], ARRAY['POD','Receiving Copy']::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1480, 360),
  ('22222222-2222-2222-2222-222222220013', 'current.freight.entry', 'process', 'current_manual', 'accounts', 'shared_all', 'Freight Entry', NULL, NULL, ARRAY['Depot Accountant']::text[], 'Depot accountant enters daily freight entries.', NULL, NULL, ARRAY['Freight not always linked to transaction, vehicle, route, and invoice']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1760, 80),
  ('22222222-2222-2222-2222-222222220013', 'current.freight.cash_closing', 'process', 'current_manual', 'accounts', 'shared_all', 'Cash Closing', NULL, NULL, ARRAY['Office','Accounts Assistant']::text[], 'Daily cash records are updated, printed, signed, and sent through WhatsApp to head office.', NULL, NULL, ARRAY['Manual closing','WhatsApp reporting','Delayed reconciliation']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'high', 'high', NULL, NULL, 1760, 220),
  ('22222222-2222-2222-2222-222222220013', 'current.freight.head_office_recon', 'process', 'current_manual', 'head_office', 'shared_all', 'Head Office Reconciliation', NULL, NULL, ARRAY['Head Office','Sales / Commercial']::text[], 'Head office gets BTST documents and receiving from parties through sales/commercial team help.', NULL, NULL, ARRAY['Follow-up dependency','Missing documents','Delayed closure']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], 'medium', 'high', NULL, NULL, 1760, 360),
  ('22222222-2222-2222-2222-222222220013', 'erp.purchase.deal_booking', 'process', 'proposed_erp', 'system', 'shared_all', 'Purchase Deal Booking', NULL, NULL, ARRAY[]::text[], NULL, 'Create Purchase Deal Booking with supplier, product, quantity, booked rate, terms, discount, scheme, delivery point, validity, and approval status.', NULL, ARRAY[]::text[], ARRAY['Purchase Management']::text[], ARRAY[]::text[], ARRAY['Supplier','Product','Quantity','Booked Rate','Terms','Discount','Scheme','Delivery Point','Validity']::text[], NULL, 'high', NULL, NULL, 80, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.purchase.approval_trail', 'approval', 'proposed_erp', 'system', 'shared_all', 'Approval Trail', NULL, NULL, ARRAY[]::text[], NULL, 'All deal approvals are recorded with user, timestamp, comments, and version history.', NULL, ARRAY[]::text[], ARRAY['Purchase Management','Approval Workflow']::text[], ARRAY[]::text[], ARRAY['User','Timestamp','Comments','Version']::text[], NULL, 'high', NULL, NULL, 80, 1240),
  ('22222222-2222-2222-2222-222222220013', 'erp.purchase.invoice_import', 'system', 'proposed_erp', 'system', 'shared_all', 'Purchase Invoice Import', NULL, NULL, ARRAY[]::text[], NULL, 'Supplier invoice creates Stock in Transit and links to Purchase Deal.', NULL, ARRAY[]::text[], ARRAY['Purchase Management','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 1380),
  ('22222222-2222-2222-2222-222222220013', 'erp.purchase.invoice_recon', 'system', 'proposed_erp', 'system', 'shared_all', 'Invoice Reconciliation', NULL, NULL, ARRAY[]::text[], NULL, 'System compares invoice against booked rate, quantity, discounts, schemes, and terms.', NULL, ARRAY[]::text[], ARRAY['Purchase Management']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 1520),
  ('22222222-2222-2222-2222-222222220013', 'erp.inventory.goods_arrival', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'Goods Arrival Report', NULL, NULL, ARRAY[]::text[], NULL, 'Mobile Goods Arrival Report captures received quantity, condition-wise stock, batch, godown, WMS/location, and driver confirmation.', NULL, ARRAY[]::text[], ARRAY['Inventory','Mobile App']::text[], ARRAY['Goods Arrival Report']::text[], ARRAY['Received Quantity','Condition-wise Stock','Batch','Godown','WMS Location','Driver Confirmation']::text[], NULL, 'high', NULL, NULL, 360, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.inventory.condition_wise', 'data', 'proposed_erp', 'system', 'shared_all', 'Condition-wise Inventory', NULL, NULL, ARRAY[]::text[], NULL, 'Stock moves automatically into Available, Damaged, Wet/Dented, Leakage, or Loose locations.', NULL, ARRAY[]::text[], ARRAY['Inventory','Godown Management']::text[], ARRAY[]::text[], ARRAY['Available','Damaged','Wet/Dented','Leakage','Loose']::text[], NULL, 'high', NULL, NULL, 360, 1240),
  ('22222222-2222-2222-2222-222222220013', 'erp.sales.deal_booking', 'process', 'proposed_erp', 'sales', 'shared_all', 'Sales Deal Booking', NULL, NULL, ARRAY[]::text[], NULL, 'Sales Deal Booking captures party, broker, product, rate, quantity, discount, terms, validity, and approval.', NULL, ARRAY[]::text[], ARRAY['Sales','Deal Booking Management']::text[], ARRAY[]::text[], ARRAY['Party','Broker','Product','Rate','Quantity','Discount','Terms','Validity','Approval']::text[], NULL, 'high', NULL, NULL, 640, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.sales.credit_check', 'decision', 'proposed_erp', 'system', 'shared_all', 'Automated Credit Check', NULL, NULL, ARRAY[]::text[], NULL, 'ERP checks credit limit, overdue, blocked status, due days, deal limit, and adhoc approval requirement.', NULL, ARRAY[]::text[], ARRAY['Credit Control','Sales']::text[], ARRAY[]::text[], ARRAY['Credit Limit','Overdue','Blocked Status','Due Days','Deal Limit','Adhoc Approval']::text[], NULL, 'high', NULL, NULL, 920, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.dispatch.program', 'system', 'proposed_erp', 'system', 'shared_all', 'Dispatch Program', NULL, NULL, ARRAY[]::text[], NULL, 'System generates dispatch program linked to approved Sales Deal and available stock.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Sales','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 920, 1240),
  ('22222222-2222-2222-2222-222222220013', 'erp.dispatch.delivery_order', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'Delivery Order', NULL, NULL, ARRAY[]::text[], NULL, 'Delivery Order is generated with vehicle, driver, transporter, product, batch, quantity, and destination.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Documents']::text[], ARRAY['Delivery Order']::text[], ARRAY['Vehicle','Driver','Transporter','Product','Batch','Quantity','Destination']::text[], NULL, 'high', NULL, NULL, 1200, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.dispatch.loading_confirm', 'process', 'proposed_erp', 'depot_godown', 'shared_all', 'Mobile Loading Confirmation', NULL, NULL, ARRAY[]::text[], NULL, 'Godown confirms loading through mobile with batch, quantity, condition, vehicle, timestamp, and user confirmation.', NULL, ARRAY[]::text[], ARRAY['Dispatch','Mobile App']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1200, 1240),
  ('22222222-2222-2222-2222-222222220013', 'erp.billing.invoice_trigger', 'system', 'proposed_erp', 'system', 'shared_all', 'Invoice Trigger', NULL, NULL, ARRAY[]::text[], NULL, 'Invoice is triggered after loading confirmation. Bill-to-ship-to rules are supported.', NULL, ARRAY[]::text[], ARRAY['Billing','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.billing.doc_checklist', 'document', 'proposed_erp', 'system', 'shared_all', 'Document Checklist', NULL, NULL, ARRAY[]::text[], NULL, 'System checks required invoice, DO, e-way bill, POD, and receiving documents.', NULL, ARRAY[]::text[], ARRAY['Documents','Billing']::text[], ARRAY['Invoice','DO','E-way Bill','POD','Receiving']::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1240),
  ('22222222-2222-2222-2222-222222220013', 'erp.billing.pod_upload', 'document', 'proposed_erp', 'depot_godown', 'shared_all', 'POD & Receiving Upload', NULL, NULL, ARRAY[]::text[], NULL, 'POD and receiving copy are uploaded and linked to invoice/order.', NULL, ARRAY[]::text[], ARRAY['Documents','Mobile App']::text[], ARRAY['POD','Receiving Copy']::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 1380),
  ('22222222-2222-2222-2222-222222220013', 'erp.freight.management', 'process', 'proposed_erp', 'accounts', 'shared_all', 'Freight Management', NULL, NULL, ARRAY[]::text[], NULL, 'Freight is linked to vehicle, transporter, route, invoice, party, and dispatch.', NULL, ARRAY[]::text[], ARRAY['Freight']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1100),
  ('22222222-2222-2222-2222-222222220013', 'erp.freight.cash_closing', 'process', 'proposed_erp', 'accounts', 'shared_all', 'Digital Cash Closing', NULL, NULL, ARRAY[]::text[], NULL, 'Cash closing is entered, approved, and visible to head office digitally.', NULL, ARRAY[]::text[], ARRAY['Cash Management','Accounts']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1240),
  ('22222222-2222-2222-2222-222222220013', 'erp.dashboard.management', 'system', 'proposed_erp', 'management', 'shared_all', 'Management Dashboard', NULL, NULL, ARRAY[]::text[], NULL, 'Dashboard shows exceptions, pending approvals, in-transit stock, pending billing, POD pending, freight pending, cash closing pending, and margin leakage.', NULL, ARRAY[]::text[], ARRAY['Dashboard','Decision Intelligence']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 1380),
  ('22222222-2222-2222-2222-222222220013', 'ai.whatsapp_extraction', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'WhatsApp-to-ERP Extraction', NULL, 'Extract Purchase Deal, Sales Deal, approvals, dispatch requests, and rate confirmations from WhatsApp-style messages or uploaded screenshots.', ARRAY[]::text[], NULL, NULL, 'Eliminates the WhatsApp dependency that creates the largest single source of operational friction.', ARRAY[]::text[], ARRAY['AI Layer','Purchase','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 2100),
  ('22222222-2222-2222-2222-222222220013', 'ai.invoice_matching', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Invoice Matching Assistant', NULL, 'Compare supplier invoice with Purchase Deal terms, discounts, schemes, plant discount, rake discount, offers, quantity, and rate.', ARRAY[]::text[], NULL, NULL, 'Catches missed discounts and plant/rake scheme leakage automatically.', ARRAY[]::text[], ARRAY['AI Layer','Purchase Management']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 80, 2240),
  ('22222222-2222-2222-2222-222222220013', 'ai.credit_risk_alert', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Credit Risk Alert', NULL, 'Warn before dispatch if party is overdue, blocked, near credit limit, or has risky payment behavior.', ARRAY[]::text[], NULL, NULL, 'Pre-empts risky dispatches before they leave the godown.', ARRAY[]::text[], ARRAY['AI Layer','Credit Control']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 920, 2100),
  ('22222222-2222-2222-2222-222222220013', 'ai.goods_arrival_ocr', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Goods Arrival OCR', NULL, 'Read signed Goods Arrival Report and identify missing fields, quantity mismatch, damage/leakage, and oil loss.', ARRAY[]::text[], NULL, NULL, 'Speeds up condition-wise stock posting; catches damage/leakage claims earlier.', ARRAY[]::text[], ARRAY['AI Layer','Inventory']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 360, 2100),
  ('22222222-2222-2222-2222-222222220013', 'ai.document_ocr', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Document OCR & Checklist', NULL, 'Verify invoice, Delivery Order, e-way bill, POD, and receiving copy.', ARRAY[]::text[], NULL, NULL, 'Removes the manual document recheck step before vehicle release.', ARRAY[]::text[], ARRAY['AI Layer','Documents']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1480, 2100),
  ('22222222-2222-2222-2222-222222220013', 'ai.smart_stock_assistant', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Smart Stock Assistant', NULL, 'Answer stock questions by godown, batch, condition, in-transit status, reserved quantity, and saleable quantity.', ARRAY[]::text[], NULL, NULL, 'Conversational layer over inventory — sales team self-serves stock visibility.', ARRAY[]::text[], ARRAY['AI Layer','Inventory','Decision Intelligence']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 640, 2100),
  ('22222222-2222-2222-2222-222222220013', 'ai.margin_leakage', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Margin Leakage Detection', NULL, 'Detect low-margin or loss-making transactions after considering purchase rate, sales rate, discount, scheme, freight, oil loss, and damage.', ARRAY[]::text[], NULL, NULL, 'Quantifies the cost of operational shortfalls and ranks fixable transactions by margin impact.', ARRAY[]::text[], ARRAY['AI Layer','Decision Intelligence','Sales']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 2100),
  ('22222222-2222-2222-2222-222222220013', 'ai.exception_dashboard', 'ai', 'erp_ai', 'ai_layer', 'shared_all', 'Exception Dashboard', NULL, 'Highlight operational exceptions requiring management attention.', ARRAY[]::text[], NULL, NULL, 'Single pane for management — what to look at first, with explainability.', ARRAY[]::text[], ARRAY['AI Layer','Dashboard']::text[], ARRAY[]::text[], ARRAY[]::text[], NULL, 'high', NULL, NULL, 1760, 2240)
ON CONFLICT (canvas_id, node_key) DO NOTHING;

INSERT INTO public.workflow_canvas_edges (
  canvas_id, edge_key, source_node_key, target_node_key,
  edge_type, phase, visibility, label, condition
) VALUES
  ('22222222-2222-2222-2222-222222220013', 'c.current.e1', 'current.purchase.deal_booking', 'current.purchase.sheet_entry', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e2', 'current.purchase.sheet_entry', 'current.purchase.recheck', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e3', 'current.purchase.recheck', 'current.purchase.dispatch_request', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e4', 'current.purchase.dispatch_request', 'current.purchase.supplier_invoice', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e5', 'current.purchase.supplier_invoice', 'current.purchase.invoice_recon', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e6', 'current.purchase.invoice_recon', 'current.purchase.truck_arrival', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e7', 'current.purchase.truck_arrival', 'current.purchase.goods_arrival', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e8', 'current.purchase.goods_arrival', 'current.purchase.move_to_available', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e9', 'current.sales.daily_rate', 'current.sales.deal_booking', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e10', 'current.sales.deal_booking', 'current.sales.sheet_entry', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e11', 'current.sales.sheet_entry', 'current.sales.recheck', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e12', 'current.sales.recheck', 'current.sales.dispatch_req', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e13', 'current.sales.dispatch_req', 'current.sales.credit_check', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e14', 'current.sales.credit_check', 'current.sales.blocked_approval', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e15', 'current.sales.credit_check', 'current.dispatch.excel_program', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e16', 'current.sales.blocked_approval', 'current.dispatch.excel_program', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e17', 'current.dispatch.excel_program', 'current.dispatch.delivery_order', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e18', 'current.dispatch.delivery_order', 'current.dispatch.loading', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e19', 'current.dispatch.loading', 'current.billing.invoice', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e20', 'current.billing.invoice', 'current.billing.doc_recheck', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e21', 'current.billing.doc_recheck', 'current.billing.pod', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e22', 'current.billing.pod', 'current.freight.entry', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e23', 'current.freight.entry', 'current.freight.cash_closing', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'c.current.e24', 'current.freight.cash_closing', 'current.freight.head_office_recon', 'normal', 'current_manual', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e1', 'erp.purchase.deal_booking', 'erp.purchase.approval_trail', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e2', 'erp.purchase.approval_trail', 'erp.purchase.invoice_import', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e3', 'erp.purchase.invoice_import', 'erp.purchase.invoice_recon', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e4', 'erp.purchase.invoice_recon', 'erp.inventory.goods_arrival', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e5', 'erp.inventory.goods_arrival', 'erp.inventory.condition_wise', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e6', 'erp.inventory.condition_wise', 'erp.sales.deal_booking', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e7', 'erp.sales.deal_booking', 'erp.sales.credit_check', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e8', 'erp.sales.credit_check', 'erp.dispatch.program', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e9', 'erp.dispatch.program', 'erp.dispatch.delivery_order', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e10', 'erp.dispatch.delivery_order', 'erp.dispatch.loading_confirm', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e11', 'erp.dispatch.loading_confirm', 'erp.billing.invoice_trigger', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e12', 'erp.billing.invoice_trigger', 'erp.billing.doc_checklist', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e13', 'erp.billing.doc_checklist', 'erp.billing.pod_upload', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e14', 'erp.billing.pod_upload', 'erp.freight.management', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e15', 'erp.freight.management', 'erp.freight.cash_closing', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'e.erp.e16', 'erp.freight.cash_closing', 'erp.dashboard.management', 'system_automation', 'proposed_erp', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e1', 'ai.whatsapp_extraction', 'erp.purchase.deal_booking', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e2', 'ai.whatsapp_extraction', 'erp.sales.deal_booking', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e3', 'ai.whatsapp_extraction', 'erp.purchase.approval_trail', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e4', 'ai.whatsapp_extraction', 'erp.dispatch.program', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e5', 'ai.invoice_matching', 'erp.purchase.invoice_import', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e6', 'ai.invoice_matching', 'erp.purchase.invoice_recon', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e7', 'ai.credit_risk_alert', 'erp.sales.credit_check', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e8', 'ai.goods_arrival_ocr', 'erp.inventory.goods_arrival', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e9', 'ai.goods_arrival_ocr', 'erp.inventory.condition_wise', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e10', 'ai.document_ocr', 'erp.billing.doc_checklist', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e11', 'ai.document_ocr', 'erp.billing.pod_upload', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e12', 'ai.smart_stock_assistant', 'erp.inventory.condition_wise', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e13', 'ai.smart_stock_assistant', 'erp.dashboard.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e14', 'ai.margin_leakage', 'erp.sales.deal_booking', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e15', 'ai.margin_leakage', 'erp.freight.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e16', 'ai.margin_leakage', 'erp.dashboard.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL),
  ('22222222-2222-2222-2222-222222220013', 'a.ai.e17', 'ai.exception_dashboard', 'erp.dashboard.management', 'ai_assisted', 'erp_ai', 'shared_all', NULL, NULL)
ON CONFLICT (canvas_id, edge_key) DO NOTHING;

