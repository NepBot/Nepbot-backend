const { Pool } = require('pg')
const config = require('../../config.js').getConfig()

exports.filterTokenActions  = (tokenIds, receipts)=>{
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && tokenIds.findIndex(tokenId => tokenId == item.receiver_id) > -1 && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf("ft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.predecessor_id
        obj.token_id = receipt.receiver_id
        let args = JSON.parse(Buffer.from(receipt.receipt.Action.actions[0].FunctionCall.args , 'base64').toString())
        obj.receiver_id = args.receiver_id
        ret.push(obj)
    }

    return ret
}

exports.filterOctActions = (receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && item.receiver_id == config.OCT_CONTRACT && item.receipt.Action.actions[0].FunctionCall.method_name == "sync_state_of")
    for (receipt of receipts) {
        let obj = {}
        let args = JSON.parse(Buffer.from(receipt.receipt.Action.actions[0].FunctionCall.args , 'base64').toString())
        obj.appchain_id = args.appchain_id
        obj.signer_id = receipt.receipt.Action.signer_id
        ret.push(obj)
    }
    return ret
}

exports.filterRoleActions = (receipts) => {
    let ret = []
    receipts = receipts.filter(item => 
        item.receipt.Action && item.receiver_id == config.RULE_CONTRACT && 
        (item.receipt.Action.actions[0].FunctionCall.method_name == "set_roles" ||
        item.receipt.Action.actions[0].FunctionCall.method_name == "del_roles")
    )
    for (receipt of receipts) {
        let obj = {}
        obj.method_name = receipt.receipt.Action.actions[0].FunctionCall.method_name
        let args_raw = new Buffer(receipt.receipt.Action.actions[0].FunctionCall.args , 'base64').toString()
        obj.args = JSON.parse(JSON.parse(args_raw).args.replace(/\\/g, ''))
        ret.push(obj)
    }
    return ret
}

exports.filterTransferActions = (accountIds, receipts) => {
    let ret = []
    receipts.forEach(item => {
        if (item.receipt.Action && item.receipt.Action.actions[0] && item.receipt.Action.actions[0].Transfer) {
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

exports.filterNftActions = (contractIds, receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && contractIds.findIndex(contractId => contractId == item.receiver_id) > -1 && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf("nft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.predecessor_id
        obj.contract_id = receipt.receiver_id
        let args = JSON.parse(Buffer.from(receipt.receipt.Action.actions[0].FunctionCall.args , 'base64').toString())
        obj.receiver_id = args.receiver_id
        ret.push(obj)
    }
    return ret
}

exports.filterParasActions = (receipts) => {
    let ret = []
    receipts = receipts.filter(item => item.receipt.Action && item.receiver_id == "x.paras.near" && item.receipt.Action.actions[0].FunctionCall.method_name.indexOf("nft_transfer") > -1)
    for (receipt of receipts) {
        let obj = {}
        obj.sender_id = receipt.predecessor_id
        let args = JSON.parse(Buffer.from(receipt.receipt.Action.actions[0].FunctionCall.args , 'base64').toString())
        obj.receiver_id = args.receiver_id
        obj.token_id = args.token_id
        ret.push(obj)
    }
    return ret
}