const { Pool } = require('pg')

const testnet_url = "postgres://public_readonly:nearprotocol@35.184.214.98/testnet_explorer";
const pool = new Pool({connectionString: testnet_url})

exports.queryActions  = async (tokenIds, time)=>{
    let token_ids_arg = "{" + tokenIds.join(",") + "}"
    let res = await pool.query(`

    SELECT
        receipt_predecessor_account_id sender_id,
        args -> 'args_json' ->> 'receiver_id' receiver_id,
        receipt_receiver_account_id token_id,
        receipt_included_in_block_timestamp timestamp
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

    `,[token_ids_arg, time])
    return res.rows
}
