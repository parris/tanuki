import { JSDOM } from 'jsdom';
import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src: any, target:any) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

// @ts-ignore
global.window = window;
global.document = window.document;
global.navigator = {
  ...global.navigator,
  userAgent: 'node.js',
};
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};
copyProps(window, global);

Enzyme.configure({ adapter: new Adapter() });
