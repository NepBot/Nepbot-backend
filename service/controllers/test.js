const paras = require("./paras.js")
const FormData = require('form-data');

async function test() {
    const formData = new FormData()
    formData.append("collection", "2")
    formData.append("decription", "22")
    formData.append("creator_id", "dev-nepbot.testnet")
    const res = await createCollection(formData, "ZGV2LW5lcGJvdC50ZXN0bmV0JmUwYzdkYTU5MjMzY2M2ZTAyMmQ0OWEyNjgzNDlkOTJkNzFkODhkODA1YWZmNzk4MzZhY2MyN2MxZDRkNjJlZjMmYzBkODM0ZTdhNjRjNzZlN2YxOThkOTM0MjlmMjYyNzYyZjI0ZTAzZDZlOTI0MDNkNmI2ZmU4ODE4MDY2MWMxN2ZhNDg2OTkwYmFkOWEzN2JiYzBlM2QzMGVkODQ1MDRiYjhmYTIyYmI0MzhlNDg3OGU2M2QzN2I3MzNlMDFlMDI=")
}