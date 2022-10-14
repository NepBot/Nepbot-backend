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

exports.getGMTTime = async () => {
  return new Date().toISOString();
};