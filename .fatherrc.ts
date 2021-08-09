import { readdirSync } from 'fs';
import { join } from 'path';

// utils must build before core
const headPkgs = ['runtime'];
const tailPkgs = ['vmi'];
const ignorePkgs = ['client'];
const otherPkgs = readdirSync(join(__dirname, 'packages')).filter(
  (pkg) =>
    !ignorePkgs.includes(pkg) &&
    pkg.charAt(0) !== '.' &&
    !headPkgs.includes(pkg) &&
    !tailPkgs.includes(pkg),
);

export default {
  target: 'node',
  cjs: { type: 'babel', lazy: true },
  disableTypeCheck: true,
  pkgs: [...headPkgs, ...otherPkgs, ...tailPkgs],
};
