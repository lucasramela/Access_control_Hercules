var ue=Object.defineProperty;var re=(e,t,n)=>t in e?ue(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var j=(e,t,n)=>re(e,typeof t!="symbol"?t+"":t,n);function z(){}function y(e,t){for(const n in t)e[n]=t[n];return e}function K(e){return e()}function P(){return Object.create(null)}function p(e){e.forEach(K)}function Q(e){return typeof e=="function"}function V(e,t){return e!=e?t==t:e!==t||e&&typeof e=="object"||typeof e=="function"}let N;function Ae(e,t){return e===t?!0:(N||(N=document.createElement("a")),N.href=t,e===N.href)}function ie(e){return Object.keys(e).length===0}function le(e,t,n,o){if(e){const s=X(e,t,n,o);return e[0](s)}}function X(e,t,n,o){return e[1]&&o?y(n.ctx.slice(),e[1](o(t))):n.ctx}function fe(e,t,n,o){return e[2],t.dirty}function ce(e,t,n,o,s,r){if(s){const a=X(t,n,o,r);e.p(a,s)}}function ae(e){if(e.ctx.length>32){const t=[],n=e.ctx.length/32;for(let o=0;o<n;o++)t[o]=-1;return t}return-1}function q(e){const t={};for(const n in e)n[0]!=="$"&&(t[n]=e[n]);return t}function D(e,t){const n={};t=new Set(t);for(const o in e)!t.has(o)&&o[0]!=="$"&&(n[o]=e[o]);return n}function de(e,t){e.appendChild(t)}function I(e,t,n){e.insertBefore(t,n||null)}function W(e){e.parentNode&&e.parentNode.removeChild(e)}function he(e,t){for(let n=0;n<e.length;n+=1)e[n]&&e[n].d(t)}function Ce(e){return document.createElement(e)}function Y(e){return document.createElementNS("http://www.w3.org/2000/svg",e)}function Z(e){return document.createTextNode(e)}function ze(){return Z(" ")}function x(){return Z("")}function Oe(e,t,n,o){return e.addEventListener(t,n,o),()=>e.removeEventListener(t,n,o)}function Be(e){return function(t){return t.preventDefault(),e.call(this,t)}}function _e(e,t,n){n==null?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n)}function S(e,t){for(const n in t)_e(e,n,t[n])}function Ie(e){return e===""?null:+e}function ge(e){return Array.from(e.childNodes)}function Le(e,t){t=""+t,e.data!==t&&(e.data=t)}function Pe(e,t){e.value=t??""}function qe(e,t,n){for(let o=0;o<e.options.length;o+=1){const s=e.options[o];if(s.__value===t){s.selected=!0;return}}(!n||t!==void 0)&&(e.selectedIndex=-1)}function De(e){const t=e.querySelector(":checked");return t&&t.__value}function Me(e,t,n){e.classList.toggle(t,!!n)}function Fe(e,t){return new e(t)}let w;function v(e){w=e}function $(){if(!w)throw new Error("Function called outside component initialization");return w}function Re(e){$().$$.on_mount.push(e)}function Te(e){$().$$.on_destroy.push(e)}const k=[],M=[];let b=[];const F=[],ee=Promise.resolve();let O=!1;function te(){O||(O=!0,ee.then(ne))}function Ue(){return te(),ee}function B(e){b.push(e)}const A=new Set;let m=0;function ne(){if(m!==0)return;const e=w;do{try{for(;m<k.length;){const t=k[m];m++,v(t),me(t.$$)}}catch(t){throw k.length=0,m=0,t}for(v(null),k.length=0,m=0;M.length;)M.pop()();for(let t=0;t<b.length;t+=1){const n=b[t];A.has(n)||(A.add(n),n())}b.length=0}while(k.length);for(;F.length;)F.pop()();O=!1,A.clear(),v(e)}function me(e){if(e.fragment!==null){e.update(),p(e.before_update);const t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(B)}}function ke(e){const t=[],n=[];b.forEach(o=>e.indexOf(o)===-1?t.push(o):n.push(o)),n.forEach(o=>o()),b=t}const E=new Set;let g;function Ge(){g={r:0,c:[],p:g}}function He(){g.r||p(g.c),g=g.p}function oe(e,t){e&&e.i&&(E.delete(e),e.i(t))}function be(e,t,n,o){if(e&&e.o){if(E.has(e))return;E.add(e),g.c.push(()=>{E.delete(e),o&&(n&&e.d(1),o())}),e.o(t)}else o&&o()}function R(e){return(e==null?void 0:e.length)!==void 0?e:Array.from(e)}function se(e,t){const n={},o={},s={$$scope:1};let r=e.length;for(;r--;){const a=e[r],f=t[r];if(f){for(const c in a)c in f||(o[c]=1);for(const c in f)s[c]||(n[c]=f[c],s[c]=1);e[r]=f}else for(const c in a)s[c]=1}for(const a in o)a in n||(n[a]=void 0);return n}function Je(e){return typeof e=="object"&&e!==null?e:{}}function Ke(e){e&&e.c()}function ve(e,t,n){const{fragment:o,after_update:s}=e.$$;o&&o.m(t,n),B(()=>{const r=e.$$.on_mount.map(K).filter(Q);e.$$.on_destroy?e.$$.on_destroy.push(...r):p(r),e.$$.on_mount=[]}),s.forEach(B)}function ye(e,t){const n=e.$$;n.fragment!==null&&(ke(n.after_update),p(n.on_destroy),n.fragment&&n.fragment.d(t),n.on_destroy=n.fragment=null,n.ctx=[])}function we(e,t){e.$$.dirty[0]===-1&&(k.push(e),te(),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31}function pe(e,t,n,o,s,r,a=null,f=[-1]){const c=w;v(e);const l=e.$$={fragment:null,ctx:[],props:r,update:z,not_equal:s,bound:P(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(t.context||(c?c.$$.context:[])),callbacks:P(),dirty:f,skip_bound:!1,root:t.target||c.$$.root};a&&a(l.root);let _=!1;if(l.ctx=n?n(e,t.props||{},(h,u,...i)=>{const d=i.length?i[0]:u;return l.ctx&&s(l.ctx[h],l.ctx[h]=d)&&(!l.skip_bound&&l.bound[h]&&l.bound[h](d),_&&we(e,h)),u}):[],l.update(),_=!0,p(l.before_update),l.fragment=o?o(l.ctx):!1,t.target){if(t.hydrate){const h=ge(t.target);l.fragment&&l.fragment.l(h),h.forEach(W)}else l.fragment&&l.fragment.c();t.intro&&oe(e.$$.fragment),ve(e,t.target,t.anchor),ne()}v(c)}class Ne{constructor(){j(this,"$$");j(this,"$$set")}$destroy(){ye(this,1),this.$destroy=z}$on(t,n){if(!Q(n))return z;const o=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return o.push(n),()=>{const s=o.indexOf(n);s!==-1&&o.splice(s,1)}}$set(t){this.$$set&&!ie(t)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}const Ee="4";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(Ee);/**
 * @license lucide-svelte v1.0.1 - ISC
 *
 * ISC License
 * 
 * Copyright (c) 2026 Lucide Icons and Contributors
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * ---
 * 
 * The following Lucide icons are derived from the Feather project:
 * 
 * airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out
 * 
 * The MIT License (MIT) (for the icons listed above)
 * 
 * Copyright (c) 2013-present Cole Bemis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */const T={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-svelte v1.0.1 - ISC
 *
 * ISC License
 * 
 * Copyright (c) 2026 Lucide Icons and Contributors
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * ---
 * 
 * The following Lucide icons are derived from the Feather project:
 * 
 * airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out
 * 
 * The MIT License (MIT) (for the icons listed above)
 * 
 * Copyright (c) 2013-present Cole Bemis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */const U=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1};/**
 * @license lucide-svelte v1.0.1 - ISC
 *
 * ISC License
 * 
 * Copyright (c) 2026 Lucide Icons and Contributors
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * ---
 * 
 * The following Lucide icons are derived from the Feather project:
 * 
 * airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out
 * 
 * The MIT License (MIT) (for the icons listed above)
 * 
 * Copyright (c) 2013-present Cole Bemis
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */const G=(...e)=>e.filter((t,n,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===n).join(" ").trim();function H(e,t,n){const o=e.slice();return o[10]=t[n][0],o[11]=t[n][1],o}function C(e){let t,n=[e[11]],o={};for(let s=0;s<n.length;s+=1)o=y(o,n[s]);return{c(){t=Y(e[10]),S(t,o)},m(s,r){I(s,t,r)},p(s,r){S(t,o=se(n,[r&32&&s[11]]))},d(s){s&&W(t)}}}function J(e){let t=e[10],n,o=e[10]&&C(e);return{c(){o&&o.c(),n=x()},m(s,r){o&&o.m(s,r),I(s,n,r)},p(s,r){s[10]?t?V(t,s[10])?(o.d(1),o=C(s),t=s[10],o.c(),o.m(n.parentNode,n)):o.p(s,r):(o=C(s),t=s[10],o.c(),o.m(n.parentNode,n)):t&&(o.d(1),o=null,t=s[10])},d(s){s&&W(n),o&&o.d(s)}}}function Se(e){let t,n,o,s,r,a=R(e[5]),f=[];for(let u=0;u<a.length;u+=1)f[u]=J(H(e,a,u));const c=e[9].default,l=le(c,e,e[8],null);let _=[T,U(e[6])?void 0:{"aria-hidden":"true"},e[6],{width:e[2]},{height:e[2]},{stroke:e[1]},{"stroke-width":o=e[4]?Number(e[3])*24/Number(e[2]):e[3]},{class:s=G("lucide-icon","lucide",e[0]?`lucide-${e[0]}`:"",e[7].class)}],h={};for(let u=0;u<_.length;u+=1)h=y(h,_[u]);return{c(){t=Y("svg");for(let u=0;u<f.length;u+=1)f[u].c();n=x(),l&&l.c(),S(t,h)},m(u,i){I(u,t,i);for(let d=0;d<f.length;d+=1)f[d]&&f[d].m(t,null);de(t,n),l&&l.m(t,null),r=!0},p(u,[i]){if(i&32){a=R(u[5]);let d;for(d=0;d<a.length;d+=1){const L=H(u,a,d);f[d]?f[d].p(L,i):(f[d]=J(L),f[d].c(),f[d].m(t,n))}for(;d<f.length;d+=1)f[d].d(1);f.length=a.length}l&&l.p&&(!r||i&256)&&ce(l,c,u,u[8],r?fe(c,u[8],i,null):ae(u[8]),null),S(t,h=se(_,[T,i&64&&(U(u[6])?void 0:{"aria-hidden":"true"}),i&64&&u[6],(!r||i&4)&&{width:u[2]},(!r||i&4)&&{height:u[2]},(!r||i&2)&&{stroke:u[1]},(!r||i&28&&o!==(o=u[4]?Number(u[3])*24/Number(u[2]):u[3]))&&{"stroke-width":o},(!r||i&129&&s!==(s=G("lucide-icon","lucide",u[0]?`lucide-${u[0]}`:"",u[7].class)))&&{class:s}]))},i(u){r||(oe(l,u),r=!0)},o(u){be(l,u),r=!1},d(u){u&&W(t),he(f,u),l&&l.d(u)}}}function We(e,t,n){const o=["name","color","size","strokeWidth","absoluteStrokeWidth","iconNode"];let s=D(t,o),{$$slots:r={},$$scope:a}=t,{name:f=void 0}=t,{color:c="currentColor"}=t,{size:l=24}=t,{strokeWidth:_=2}=t,{absoluteStrokeWidth:h=!1}=t,{iconNode:u=[]}=t;return e.$$set=i=>{n(7,t=y(y({},t),q(i))),n(6,s=D(t,o)),"name"in i&&n(0,f=i.name),"color"in i&&n(1,c=i.color),"size"in i&&n(2,l=i.size),"strokeWidth"in i&&n(3,_=i.strokeWidth),"absoluteStrokeWidth"in i&&n(4,h=i.absoluteStrokeWidth),"iconNode"in i&&n(5,u=i.iconNode),"$$scope"in i&&n(8,a=i.$$scope)},t=q(t),[f,c,l,_,h,u,s,t,a,r]}class Qe extends Ne{constructor(t){super(),pe(this,t,We,Se,V,{name:0,color:1,size:2,strokeWidth:3,absoluteStrokeWidth:4,iconNode:5})}}export{Q as A,Ce as B,ze as C,Fe as D,Le as E,Z as F,x as G,z as H,Qe as I,Re as J,Ue as K,Te as L,M,Pe as N,Ie as O,qe as P,Be as Q,B as R,Ne as S,De as T,Ae as U,y as a,oe as b,Je as c,ye as d,Ke as e,q as f,se as g,le as h,pe as i,ae as j,fe as k,R as l,ve as m,W as n,he as o,Ge as p,He as q,p as r,V as s,be as t,ce as u,_e as v,Me as w,I as x,de as y,Oe as z};
