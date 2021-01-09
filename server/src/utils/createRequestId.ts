function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export default () => `${Date.now()}-${getRandomInt(9999999)}`;
