const { Pool } = require('pg')
const { config } = require('../../utils/config.js')
const bs64 = require('bs64') 

const testnet_url = "postgres://public_readonly:nearprotocol@35.184.214.98/testnet_explorer";
const pool = new Pool({connectionString: testnet_url})

exports.queryTokenActions  = async (tokenIds, receipts)=>{
    let ret = []
    receipts = receipts.filter(item => tokenIds.findIndex(tokenId => tokenId == item.receiver_id) > -1 && receipts.Action.actions[0].FunctionCall.method_name.indexOf("ft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.predecessor_id
        obj.token_id = receipt.receiver_id
        let args = JSON.parse(bs64.decode(receipt.Action.actions[0].FunctionCall.args))
        obj.receiver_id = args.receiver_id
        ret.push(obj)
    }

    return ret
}

exports.queryOctActions = async (receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receiver_id == config.OCT_CONTRACT && receipts.Action.actions[0].FunctionCall.method_name == "sync_state_of")
    for (receipt of receipts) {
        let obj = {}
        let args = JSON.parse(bs64.decode(receipt.Action.actions[0].FunctionCall.args))
        obj.appchain_id = args.appchain_id
        obj.signer_id = receipt.Action.signer_id
        ret.push(obj)
    }
    return ret
}

exports.queryRoleActions = async (receipts) => {
    let ret = []
    receipts = receipts.filter(item => 
        item.receiver_id == config.RULE_CONTRACT && 
        (receipts.Action.actions[0].FunctionCall.method_name == "set_roles" ||
        receipts.Action.actions[0].FunctionCall.method_name == "del_roles")
    )
    for (receipt of receipts) {
        let obj = {}
        obj.method_name = receipt.Action.actions[0].FunctionCall.method_name
        let args_raw = bs64.decode(receipt.Action.actions[0].FunctionCall.args)
        obj.args = JSON.parse(JSON.parse(args_raw).args.replace(/\\/g, ''))
        ret.push(obj)
    }
    return ret





    // let res = await pool.query(
    // `
    // SELECT
    //     args ->> 'args_json' as args,
    //     args ->> 'method_name' as method_name
    // FROM 
    //     action_receipt_actions
    // LEFT JOIN execution_outcomes ON action_receipt_actions.receipt_id = execution_outcomes.receipt_id
    // WHERE
    //     receipt_receiver_account_id = $1
    //     AND action_kind = 'FUNCTION_CALL' 
    //     AND args ->> 'args_json' IS NOT NULL 
    //     AND args ->> 'method_name' IN ( 'set_roles', 'del_role' ) 
    //     AND receipt_included_in_block_timestamp >= $2
    //     AND status != 'FAILURE'
    // ORDER BY
    //     receipt_included_in_block_timestamp DESC  
    // `
    // , [config.RULE_CONTRACT, time])
    // let ret = []
    // for (row of res.rows) {
    //     ret.push({
    //         args: JSON.parse(JSON.parse(row.args).args.replace(/\\/g, '')),
    //         method_name: row.method_name
    //     })
    // }
    // return ret
}

exports.queryTransferActions = async (accountIds, receipts) => {
    let ret = []
    receipts.forEach(item => {
        if (receipts.Action.actions[0].Transfer) {
            if (accountIds.findIndex(accountId => accountId == item.receiver_id) > -1) {
                ret.push({account_id: item.receiver_id})
            }
            if (accountIds.findIndex(accountId => accountId == item.predecessor_id) > -1) {
                ret.push({account_id: item.predecessor_id})
            }
        }
       
    })
    return ret
}