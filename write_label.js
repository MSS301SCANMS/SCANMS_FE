const fs = require('fs');
const path = require('path');
const dst = 'd:/SEP490/SCANMS-project-capstone-fall26/frontend/src/components/orders/ShippingLabel.tsx';
const src = 'd:/SEP490/SCANMS-project-capstone-fall26/frontend/src/components/orders/ShippingLabel.template';
const content = fs.readFileSync(src, 'utf8');
fs.writeFileSync(dst, content, 'utf8');
console.log('Written', content.length, 'bytes');
