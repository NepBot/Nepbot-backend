module.exports = class {
	constructor({ code, message, success, data }) {
		this.code = code || 200;
		this.message = message || 'success';
		this.success = success || true;
		this.data = data;
	}
};