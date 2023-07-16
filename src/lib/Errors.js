class GeneralError extends Error {
  constructor({ msg, data, code }) {
    super(msg);
    this.data = data;
    this.code = code;
    this.name = this.constructor.name;
  }
}

module.exports = {
  GeneralError,
};
