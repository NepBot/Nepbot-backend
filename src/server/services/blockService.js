const { Pool } = require('pg')
const { config } = require('../../utils/config.js')
const bs64 = require('bs64') 

const testnet_url = "postgres://public_readonly:nearprotocol@35.184.214.98/testnet_explorer";
//const pool = new Pool({connectionString: testnet_url})

exports.filterTokenActions  = (tokenIds, receipts)=>{
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && tokenIds.findIndex(tokenId => tokenId == item.receipt.receiver_id) > -1 && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf("ft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.receipt.predecessor_id
        obj.token_id = receipt.receipt.receiver_id
        let args = JSON.parse(bs64.decode(receipt.receipt.Action.actions[0].FunctionCall.args))
        obj.receiver_id = args.receiver_id
        ret.push(obj)
    }

    return ret
}

exports.filterOctActions = (receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && item.receipt.receiver_id == config.OCT_CONTRACT && item.receipt.Action.actions[0].FunctionCall.method_name == "sync_state_of")
    for (receipt of receipts) {
        let obj = {}
        let args = JSON.parse(bs64.decode(receipt.receipt.Action.actions[0].FunctionCall.args))
        obj.appchain_id = args.appchain_id
        obj.signer_id = receipt.receipt.Action.signer_id
        ret.push(obj)
    }
    return ret
}

exports.filterRoleActions = (receipts) => {
    let ret = []
    receipts = receipts.filter(item => 
        item.receipt.Action && item.receipt.receiver_id == config.RULE_CONTRACT && 
        (item.receipt.Action.actions[0].FunctionCall.method_name == "set_roles" ||
        item.receipt.Action.actions[0].FunctionCall.method_name == "del_roles")
    )
    for (receipt of receipts) {
        let obj = {}
        obj.method_name = receipt.receipt.Action.actions[0].FunctionCall.method_name
        let args_raw = bs64.decode(receipt.receipt.Action.actions[0].FunctionCall.args)
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

exports.filterTransferActions = (accountIds, receipts) => {
    let ret = []
    receipts.forEach(item => {
        if (item.receipt.Action && item.receipt.Action.actions[0].Transfer) {
            if (accountIds.findIndex(accountId => accountId == item.receipt.receiver_id) > -1) {
                ret.push({account_id: item.receipt.receiver_id})
            }
            if (accountIds.findIndex(accountId => accountId == item.receipt.predecessor_id) > -1) {
                ret.push({account_id: item.receipt.predecessor_id})
            }
        }
       
    })
    return ret
}

exports.filterNftActions = (contractIds, receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && contractIds.findIndex(contractId => contractId == item.receipt.receiver_id) > -1 && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf("nft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.receipt.predecessor_id
        obj.contract_id = receipt.receipt.receiver_id
        let args = JSON.parse(bs64.decode(receipt.receipt.Action.actions[0].FunctionCall.args))
        obj.receiver_id = args.receiver_id
        ret.push(obj)
    }
    return ret
}

exports.filterParasActions = (receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && item.receipt.receiver_id == "x.paras.near" && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf("nft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.receipt.predecessor_id
        let args = JSON.parse(bs64.decode(receipt.receipt.Action.actions[0].FunctionCall.args))
        obj.receiver_id = args.receiver_id
        obj.token_id = args.token_id
        ret.push(obj)
    }
    return ret
}