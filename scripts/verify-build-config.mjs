import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const config = readFileSync(resolve(root, 'app.config.ts'), 'utf8');
const eas = JSON.parse(readFileSync(resolve(root, 'eas.json'), 'utf8'));

const requiredScripts = ['build:bundle', 'build:android:debug', 'verify:config'];
const missingScripts = requiredScripts.filter((script) => !packageJson.scripts?.[script]);
if (missingScripts.length > 0)
  throw new Error(`Missing build scripts: ${missingScripts.join(', ')}`);
for (const profile of ['development', 'preview', 'production']) {
  if (!eas.build?.[profile]) throw new Error(`Missing EAS build profile: ${profile}`);
}
if (!config.includes("bundleIdentifier: 'com.pdfscannerpro.app'"))
  throw new Error('iOS bundle identifier is missing');
if (!config.includes("package: 'com.pdfscannerpro.app'"))
  throw new Error('Android package is missing');

const forbidden = ['GoogleService-Info.plist', 'google-services.json', '.env', 'keystore'];
const present = forbidden.filter((name) => existsSync(resolve(root, name)));
if (present.length > 0)
  throw new Error(`Credential/config files must not be committed: ${present.join(', ')}`);
console.log('Build configuration is structurally valid and contains no root credential files.');
