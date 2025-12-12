-- ================================================
-- Stored Procedure untuk Check Database Status
-- ================================================
-- Jalankan script ini di phpMyAdmin untuk membuat
-- stored procedure yang mengecek status database
-- ================================================
-- UPDATED: For new sensor structure v2.0
-- ================================================

DELIMITER //

DROP PROCEDURE IF EXISTS check_database_status //

CREATE PROCEDURE check_database_status()
BEGIN
    DECLARE total_records INT DEFAULT 0;
    DECLARE table_size_mb DECIMAL(10,2) DEFAULT 0;
    DECLARE database_size_mb DECIMAL(10,2) DEFAULT 0;
    DECLARE status_msg VARCHAR(255) DEFAULT 'OK';
    DECLARE status_code VARCHAR(20) DEFAULT 'OK';
    DECLARE warning_limit INT DEFAULT 100000;
    DECLARE critical_limit INT DEFAULT 500000;
    
    -- Sensor counts
    DECLARE humidity_count INT DEFAULT 0;
    DECLARE temperature_count INT DEFAULT 0;
    DECLARE waterLevel_count INT DEFAULT 0;

    -- 1. Get total records in sensor_data
    SELECT COUNT(*) INTO total_records FROM sensor_data;
    
    -- 2. Get counts by sensor type
    SELECT COUNT(*) INTO humidity_count FROM sensor_data WHERE sensor_type = 'humidity';
    SELECT COUNT(*) INTO temperature_count FROM sensor_data WHERE sensor_type = 'temperature';
    SELECT COUNT(*) INTO waterLevel_count FROM sensor_data WHERE sensor_type = 'waterLevel';

    -- 3. Get table size in MB
    SELECT 
        ROUND(((data_length + index_length) / 1024 / 1024), 2) 
    INTO table_size_mb 
    FROM information_schema.TABLES 
    WHERE table_schema = DATABASE() AND table_name = 'sensor_data';

    -- 4. Get total database size in MB
    SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) 
    INTO database_size_mb 
    FROM information_schema.TABLES 
    WHERE table_schema = DATABASE();

    -- 5. Determine Status
    IF total_records >= critical_limit THEN
        SET status_code = 'CRITICAL';
        SET status_msg = CONCAT('Database CRITICAL! Total records: ', total_records, '. Immediate cleanup required.');
    ELSEIF total_records >= warning_limit THEN
        SET status_code = 'WARNING';
        SET status_msg = CONCAT('Database Warning. Total records: ', total_records, '. Consider cleanup soon.');
    ELSE
        SET status_code = 'OK';
        SET status_msg = 'Database status normal.';
    END IF;

    -- 6. Return Result
    SELECT 
        total_records,
        IFNULL(table_size_mb, 0) as table_size_mb,
        IFNULL(database_size_mb, 0) as database_size_mb,
        status_code as status,
        status_msg as message,
        warning_limit as warning_threshold,
        critical_limit as critical_threshold,
        humidity_count,
        temperature_count,
        waterLevel_count;

END //

DELIMITER ;

-- ================================================
-- Test the stored procedure
-- ================================================
-- CALL check_database_status();
