const { Pool } = require('pg')
const { config } = require('../../utils/config.js')

const testnet_url = "postgres://public_readonly:nearprotocol@35.184.214.98/testnet_explorer";
const pool = new Pool({connectionString: testnet_url})

exports.queryActions  = async (tokenIds, time)=>{
    let token_ids_arg = "{" + tokenIds.join(",") + "}"
    console.log("--------------------------------", time)
    let res = await pool.query(`

    SELECT
        receipt_predecessor_account_id as sender_id,
        args -> 'args_json' ->> 'receiver_id' as receiver_id,
        receipt_receiver_account_id as token_id,
        receipt_included_in_block_timestamp as timestamp
    FROM
        action_receipt_actions 
    WHERE
        receipt_receiver_account_id = any ($1)
        AND action_kind = 'FUNCTION_CALL' 
        AND args ->> 'args_json' IS NOT NULL 
        AND args ->> 'method_name' IN ( 'ft_transfer', 'ft_transfer_call', 'ft_mint' ) 
        AND receipt_included_in_block_timestamp >= $2
    ORDER BY
        receipt_included_in_block_timestamp DESC 

    `,[token_ids_arg, time])
    console.log(res.rows)
    return res.rows
}

exports.queryOctActions = async (time) => {
    let res = await pool.query(`
    SELECT
        args -> 'args_json' ->> 'appchain_id' as appchain_id,
        signer_account_id as signer_id
    FROM
        action_receipt_actions
    RIGHT JOIN action_receipts ON action_receipt_actions.receipt_id = action_receipts.receipt_id
    WHERE
        receipt_receiver_account_id = $1
        AND action_kind = 'FUNCTION_CALL' 
        AND args ->> 'args_json' IS NOT NULL 
        AND args ->> 'method_name' = 'sync_state_of'
        AND receipt_included_in_block_timestamp >= $2
    ORDER BY
        receipt_included_in_block_timestamp DESC 
    `,[config.OCT_CONTRACT, time])
    console.log(res.rows)
    return res.rows
}
