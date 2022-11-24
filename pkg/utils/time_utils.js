exports.getExpiredTimeByDay = async (numOfDays) => {
  const date = new Date();
  date.setDate(date.getDate() + numOfDays);
  return date;
};
// this.getExpiredTimeByDay(1).then(console.log);

exports.getExpiredTimeBySecond = async (second) => {
  const expiredAt = Date.now() + second * 1000;
  return new Date(expiredAt).toISOString();
};
// this.getExpiredTime(7200).then(console.log);

exports.getISOTime = async (milliseconds) => {
  if (milliseconds) {
    return new Date(milliseconds).toISOString();
  }
  return new Date().toISOString();
};
// this.getISOTime(1669241673 * 1000).then(console.log);

exports.getUTCTime = async (milliseconds) => {
  if (milliseconds) {
    return new Date(milliseconds).toUTCString();
  }
  return new Date().toUTCString();
};
// this.getGMTTime(1669241673 * 1000).then(console.log);