import '@testing-library/jest-dom';

global.Audio = class {
  play() {
    return {
      catch: () => {},
    };
  }
};