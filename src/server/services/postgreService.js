const { Pool } = require('pg')

const testnet_url = "postgres://public_readonly:nearprotocol@35.184.214.98/testnet_explorer";
const pool = new Pool({connectionString: testnet_url})

exports.queryExpenses  = async (tokenId,walletId, time)=>{
    return await pool.query(`
    SELECT
        sender_id,
        CAST ( SUM ( CAST ( args ->> 'amount' AS float8 ) ) AS NUMERIC ) amount 
    FROM
        (
            SELECT
                receipt_predecessor_account_id sender_id,
                args -> 'args_json' args,
                receipt_included_in_block_timestamp 
            FROM
                action_receipt_actions 
            WHERE
                receipt_receiver_account_id = $1
                AND action_kind = 'FUNCTION_CALL' 
                AND args ->> 'args_json' IS NOT NULL 
                AND args ->> 'method_name' IN ( 'ft_transfer', 'ft_transfer_call', 'ft_mint' ) 
                AND receipt_predecessor_account_id = $2
                AND receipt_included_in_block_timestamp >= $3
            ORDER BY
                receipt_included_in_block_timestamp DESC 
            ) A 
    GROUP BY
        sender_id;
    `,[tokenId,walletId,time])
}

exports.queryIncome  = async (tokenId,walletId, time)=>{
    return await pool.query(`
        SELECT
            args ->> 'receiver_id' receiver_id,
            CAST ( SUM ( CAST ( args ->> 'amount' AS float8 ) ) AS NUMERIC ) amount 
        FROM
        (
            SELECT
                receipt_predecessor_account_id sender_id,
                args -> 'args_json' args,
                receipt_included_in_block_timestamp 
            FROM
                action_receipt_actions 
            WHERE
                receipt_receiver_account_id = $1
                AND action_kind = 'FUNCTION_CALL' 
                AND args ->> 'args_json' IS NOT NULL 
                AND args ->> 'method_name' IN ( 'ft_transfer', 'ft_transfer_call', 'ft_mint' ) 
                AND receipt_included_in_block_timestamp >= $2 
            ORDER BY
                receipt_included_in_block_timestamp DESC 
        ) A 
            where args ->> 'receiver_id' = $3
        GROUP BY
        args ->> 'receiver_id';
    `,[tokenId,time,walletId])
}
