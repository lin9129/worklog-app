SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Product', 'Process', 'Part', 'WorkLog', 'LotSummary')
ORDER BY table_name, column_name;
