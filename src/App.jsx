import React, { useEffect, useState } from 'react';

const products = [
  {
    id: 'flow', name: 'Brightloop Flow', category: 'CUSTOMER MANAGEMENT',
    title: 'Build stronger customer relationships.', description: 'Keep customer information, conversations and sales opportunities organised in one clear workspace.',
    price: '₹1,299', period: '/ month', features: ['Customer and contact records', 'Sales pipeline tracking', 'Follow-up reminders'],
    icon: 'flow', color: 'blue', tag: 'Popular choice'
  },
  {
    id: 'people', name: 'Brightloop People', category: 'HUMAN RESOURCES',
    title: 'Make people operations simpler.', description: 'Bring employee records, attendance and everyday HR tasks together for your growing team.',
    price: '₹899', period: '/ month', features: ['Employee directory', 'Leave and attendance', 'HR documentation'],
    icon: 'people', color: 'violet', tag: 'For growing teams'
  },
  {
    id: 'books', name: 'Brightloop Books', category: 'FINANCE & BILLING',
    title: 'Stay on top of the numbers.', description: 'Organise invoices, expenses and everyday financial activity with less manual work.',
    price: '₹699', period: '/ month', features: ['Invoice management', 'Expense tracking', 'Financial summaries'],
    icon: 'books', color: 'mint', tag: 'Everyday essential'
  },
  {
    id: 'core', name: 'Brightloop Core', category: 'BUSINESS OPERATIONS',
    title: 'Connect the moving parts of business.', description: 'Coordinate purchasing, operations and resources with a unified business workspace.',
    price: '₹2,499', period: '/ month', features: ['Operations overview', 'Purchasing workflows', 'Resource planning'],
    icon: 'core', color: 'amber'
  },
  {
    id: 'stock', name: 'Brightloop Stock', category: 'INVENTORY MANAGEMENT',
    title: 'Know what is in stock, always.', description: 'Track products, stock movement and warehouse activity as your business grows.',
    price: '₹999', period: '/ month', features: ['Stock level tracking', 'Product catalogue', 'Warehouse overview'],
    icon: 'stock', color: 'rose'
  },
  {
    id: 'projects', name: 'Brightloop Projects', category: 'WORK MANAGEMENT',
    title: 'Keep every team moving forward.', description: 'Plan work, coordinate responsibilities and see project progress in one place.',
    price: '₹1,499', period: '/ month', features: ['Project workspaces', 'Task coordination', 'Progress overview'],
    icon: 'projects', color: 'cyan'
  }
];

function Logo({ light = false }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="/" aria-label="Brightloop home">
    <span className="brand-mark"><span></span><span></span><span></span></span>
    <span>brightloop<span className="brand-period">.</span></span>
  </a>;
}

function Icon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A11.4 11.4 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3 3.8" /><path d="M6.2 6.3C3.5 8.1 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.2 3-.5" /></>,
    sparkle: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>
  };
  return <svg {...common}>{paths[name] || paths.sparkle}</svg>;
}

function ProductGlyph({ type }) {
  const shapes = {
    flow: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
    books: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h5M8 17h3" /></>,
    core: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
    stock: <><path d="m3 8 9-5 9 5v10l-9 5-9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v10M7.5 5.5l9 5" /></>,
    projects: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M8 4V2M16 4V2M3 9h18M8 13h3M8 16h7" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[type]}</svg>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="nav-wrap container">
      <Logo />
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Icon name={open ? 'close' : 'menu'} /></button>
      <nav className={open ? 'nav-links nav-open' : 'nav-links'}>
        <a href="#home" onClick={() => setOpen(false)}>Home</a>
        <a href="#products" onClick={() => setOpen(false)}>Products</a>
        <a href="#solutions" onClick={() => setOpen(false)}>Solutions</a>
        <a href="#about" onClick={() => setOpen(false)}>About</a>
        <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
      </nav>
      <div className="nav-actions"><a className="nav-signin" href="/login">Sign in</a><a className="button button-primary button-small" href="/signup">Get started <Icon name="arrow" size={16} /></a></div>
    </div>
  </header>;
}

function HeroVisual() {
  return <div className="hero-visual" aria-label="Illustration of Brightloop business software workspace">
    <div className="visual-orbit orbit-one"></div><div className="visual-orbit orbit-two"></div>
    <div className="float-chip chip-top"><span className="chip-dot dot-green"></span> Workspace connected</div>
    <div className="dashboard-window">
      <div className="window-top"><div className="window-dots"><i></i><i></i><i></i></div><span>brightloop workspace</span><span className="window-avatar">B</span></div>
      <div className="window-body">
        <aside className="mini-sidebar"><b className="mini-logo">b.</b><i className="mini-active"></i><i></i><i></i><i></i><i></i></aside>
        <div className="mini-main"><div className="mini-heading"><div><small>MONDAY, 12 OCTOBER</small><h3>Your workspace</h3></div><span className="mini-pill">Overview</span></div>
          <div className="mini-stats"><div><small>Open tasks</small><b>24</b><em>Across your team</em></div><div><small>Customers</small><b>1,284</b><em>Customer records</em></div></div>
          <div className="mini-chart"><div className="chart-title"><b>Business overview</b><small>Last 6 months</small></div><div className="chart-bars"><i style={{ height: '38%' }}></i><i style={{ height: '54%' }}></i><i style={{ height: '46%' }}></i><i style={{ height: '72%' }}></i><i style={{ height: '61%' }}></i><i style={{ height: '88%' }}></i><i style={{ height: '76%' }}></i><i style={{ height: '100%' }}></i></div><div className="chart-labels"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div></div>
          <div className="mini-products"><span className="mini-product-icon">✦</span><div><b>Everything in one place</b><small>Tools that work together for your business</small></div><span className="mini-arrow">↗</span></div>
        </div>
      </div>
    </div>
    <div className="float-chip chip-bottom"><span className="chip-symbol">✦</span> Made for growing teams</div>
  </div>;
}

function ProductCard({ product, locked, onDetails }) {
  return <article className={`product-card ${locked ? 'product-locked' : ''}`}>
    <div className="product-card-content">
      <div className="product-card-top"><span className={`product-icon ${product.color}`}><ProductGlyph type={product.icon} /></span>{product.tag && <span className="product-tag">{product.tag}</span>}</div>
      <p className="eyebrow product-category">{product.category}</p>
      <h3>{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <div className="product-price"><strong>{product.price}</strong><span>{product.period}</span></div>
      <button className="product-link" onClick={() => onDetails(product)}>View details <Icon name="arrow" size={16} /></button>
    </div>
    {locked && <div className="lock-overlay"><div className="lock-content"><span className="lock-icon"><Icon name="lock" size={23} /></span><strong>Sign in to see more</strong><span>Explore this and more Brightloop solutions.</span><a href="/login" className="lock-link">Sign in <Icon name="arrow" size={14} /></a></div></div>}
  </article>;
}

function DetailModal({ product, onClose }) {
  useEffect(() => {
    if (!product) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [product, onClose]);
  if (!product) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="modal-close" onClick={onClose} aria-label="Close details"><Icon name="close" /></button>
      <span className={`product-icon modal-product-icon ${product.color}`}><ProductGlyph type={product.icon} /></span>
      <p className="eyebrow">{product.category}</p><h2 id="modal-title">{product.name}</h2><p className="modal-description">{product.title} {product.description}</p>
      <div className="modal-price"><strong>{product.price}</strong><span>{product.period}</span><small>Illustrative demo pricing</small></div>
      <h4>What is included</h4><ul className="feature-list">{product.features.map((f) => <li key={f}><Icon name="check" size={17} />{f}</li>)}</ul>
      <a className="button button-primary button-full" href="/signup">Get started <Icon name="arrow" size={16} /></a>
    </section>
  </div>;
}

function LandingPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  return <><Header />
    <main>
      <section className="hero-section" id="home"><div className="container hero-grid"><div className="hero-copy"><div className="hero-kicker"><span className="kicker-spark"><Icon name="sparkle" size={14} /></span> SOFTWARE THAT MOVES BUSINESS FORWARD</div><h1>Better tools.<br /><span>Brighter business.</span></h1><p className="hero-description">From everyday operations to ambitious growth, find the business software that helps your team do its best work.</p><div className="hero-actions"><a className="button button-primary" href="#products">Explore products <Icon name="arrow" size={17} /></a><a className="button button-secondary" href="/signup">Get started</a></div><div className="hero-note"><span className="note-check"><Icon name="check" size={13} /></span> Flexible software subscriptions for businesses of every size</div></div><HeroVisual /></div><div className="hero-bottom-line container"><span>BUSINESS SOFTWARE, MADE MORE APPROACHABLE</span><span className="line-divider"></span><span>BUILT FOR TEAMS AT EVERY STAGE</span></div></section>

      <section className="intro-section section-pad" id="about"><div className="container intro-grid"><div><p className="eyebrow">A LITTLE ABOUT US</p><h2>Technology should make<br />business feel <span>simpler.</span></h2></div><div className="intro-copy"><p>Brightloop brings practical business software together in one growing portfolio. We help small businesses, growing teams and established organisations find the tools they need to run their work with confidence.</p><p>Choose the solutions that fit your business today, with flexible subscription options as your needs evolve.</p><a className="text-link" href="#solutions">See how we help <Icon name="arrow" size={16} /></a></div></div></section>

      <section className="products-section section-pad" id="products"><div className="container"><div className="section-heading"><div><p className="eyebrow">THE BRIGHTLOOP COLLECTION</p><h2>Tools for the work<br />that <span>keeps you moving.</span></h2></div><p>Explore business software designed to make everyday work more organised, connected and manageable.</p></div><div className="product-grid">{products.map((p, i) => <ProductCard key={p.id} product={p} locked={i > 2} onDetails={setSelectedProduct} />)}</div><div className="locked-note"><span className="locked-note-icon"><Icon name="lock" size={17} /></span><span><strong>There's more to discover.</strong> Sign in to explore the full Brightloop product collection.</span><a href="/login">Sign in <Icon name="arrow" size={15} /></a></div></div></section>

      <section className="solutions-section section-pad" id="solutions"><div className="container"><div className="center-heading"><p className="eyebrow">MADE TO FIT YOUR NEXT STEP</p><h2>Right-sized software.<br /><span>Room to grow.</span></h2><p>Whether you are starting small or coordinating a larger organisation, find solutions that fit the way your business works.</p></div><div className="solutions-grid"><article className="solution-card small-business"><div className="solution-art art-small"><div className="art-window"><span></span><span></span><span></span><div className="art-lines"><i></i><i></i><i></i></div><div className="art-boxes"><i></i><i></i><i></i></div></div><div className="art-spark">✳</div></div><div className="solution-text"><p className="eyebrow">FOR SMALL BUSINESSES</p><h3>Get the essentials<br />working smoothly.</h3><p>Practical tools for the day-to-day: customers, people, invoices and inventory — without unnecessary complexity.</p><a className="text-link" href="#products">Explore solutions <Icon name="arrow" size={16} /></a></div></article><article className="solution-card enterprise"><div className="solution-art art-enterprise"><div className="enterprise-panel"><div className="enterprise-sidebar"><i></i><i></i><i></i><i></i></div><div className="enterprise-content"><span></span><span></span><div><i></i><i></i><i></i></div><b></b></div></div><div className="art-orbit">✧</div></div><div className="solution-text"><p className="eyebrow">FOR GROWING TEAMS & ENTERPRISES</p><h3>Bring more of your<br />business together.</h3><p>Explore connected software options for teams, departments and more complex business operations.</p><a className="text-link" href="#products">Explore solutions <Icon name="arrow" size={16} /></a></div></article></div></div></section>

      <section className="why-section section-pad"><div className="container why-grid"><div className="why-heading"><p className="eyebrow">THE BRIGHTLOOP DIFFERENCE</p><h2>Built around the<br /><span>way you work.</span></h2><p>Good software should fit your business, not the other way around.</p></div><div className="benefit-list"><div className="benefit"><span className="benefit-icon"><Icon name="check" /></span><div><h3>Flexible by design</h3><p>Choose the products and subscription options that make sense for your needs.</p></div></div><div className="benefit"><span className="benefit-icon"><Icon name="check" /></span><div><h3>Options that can grow with you</h3><p>Start with what you need and explore more products, variants and add-ons over time.</p></div></div><div className="benefit"><span className="benefit-icon"><Icon name="check" /></span><div><h3>One clear place to explore</h3><p>Discover a portfolio of business tools through a straightforward experience.</p></div></div></div></div></section>

      <section className="cta-section" id="contact"><div className="container cta-inner"><div><p className="eyebrow">YOUR NEXT STEP STARTS HERE</p><h2>Find a brighter way<br />to work.</h2><p>Explore Brightloop software and find the tools that fit your business.</p></div><div className="cta-actions"><a className="button button-white" href="#products">Explore products <Icon name="arrow" size={17} /></a><a className="cta-signin" href="/signup">Create your account <Icon name="arrow" size={15} /></a></div><div className="cta-decoration deco-one"></div><div className="cta-decoration deco-two"></div></div></section>
    </main>
    <footer className="site-footer"><div className="container footer-main"><div className="footer-brand"><Logo /><p>Business software for the work<br />you do every day.</p></div><div className="footer-column"><h4>Explore</h4><a href="#products">Products</a><a href="#solutions">Solutions</a><a href="#about">About Brightloop</a></div><div className="footer-column"><h4>Get started</h4><a href="/login">Sign in</a><a href="/signup">Create account</a><a href="#contact">Contact</a></div><div className="footer-column"><h4>Information</h4><a href="#contact">Privacy</a><a href="#contact">Terms</a><a href="#contact">Support</a></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Brightloop Software. All rights reserved.</span><span>Thoughtful software for better business.</span></div></footer>
    <DetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
  </>;
}

function AuthShell({ children, pageTitle, pageDescription }) {
  return <main className="auth-page"><section className="auth-aside"><div className="auth-aside-top"><Logo light /><a href="/" className="back-home">Back to website <Icon name="arrow" size={15} /></a></div><div className="auth-aside-content"><div className="auth-art"><div className="auth-art-card auth-card-back"><span className="auth-art-mark">✦</span><i></i><i></i><i></i></div><div className="auth-art-card auth-card-front"><div className="auth-art-head"><span className="auth-mini-logo">b.</span><span className="auth-art-dots">•••</span></div><div className="auth-art-title">Your business,<br />in a brighter flow.</div><div className="auth-art-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div className="auth-art-footer"><span></span><span></span><span></span></div></div><div className="auth-art-orbit"></div></div><p className="eyebrow auth-eyebrow">A BETTER WAY TO WORK</p><h1>Make room for<br /><span>what's next.</span></h1><p className="auth-aside-copy">Discover practical software solutions that help your business stay organised, work smarter and move forward.</p></div><div className="auth-aside-bottom"><span>Business software, made more approachable.</span><span>© {new Date().getFullYear()} Brightloop</span></div></section><section className="auth-main"><div className="auth-mobile-brand"><Logo /></div><div className="auth-form-wrap">{children}</div><div className="auth-main-footer">By continuing, you agree to Brightloop's <a href="/#contact">Terms</a> and <a href="/#contact">Privacy Policy</a>.</div></section></main>;
}

function AuthMessage({ children, type = 'info' }) {
  if (!children) return null;
  return <div className={`form-message message-${type}`} role="status">{children}</div>;
}

function PasswordInput({ label = 'Password', value, onChange, placeholder = 'Enter your password', autoComplete = 'current-password', showRequirements = false }) {
  const [visible, setVisible] = useState(false);
  return <div className="field"><label>{label}</label><div className="password-wrap"><input type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required /><button type="button" className="password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}><Icon name={visible ? 'eyeOff' : 'eye'} size={18} /></button></div>{showRequirements && <div className="password-hint">Use more than 8 characters, including uppercase, lowercase and a special character.</div>}</div>;
}

function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [remember, setRemember] = useState(false); const [message, setMessage] = useState('');
  function submit(e) { e.preventDefault(); setMessage('The login interface is ready. Connect your authentication API to enable sign-in.'); }
  return <AuthShell><div className="auth-heading"><span className="auth-step">WELCOME BACK</span><h2>Sign in to Brightloop</h2><p>Enter your details to continue to your account.</p></div><form className="auth-form" onSubmit={submit}><div className="field"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required /></div><PasswordInput value={password} onChange={e => setPassword(e.target.value)} /><div className="form-options"><label className="check-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /><span className="custom-check"></span>Remember me</label><a href="/forgot-password">Forgot password?</a></div><button className="button button-primary button-full" type="submit">Sign in <Icon name="arrow" size={17} /></button><AuthMessage>{message}</AuthMessage></form><p className="auth-switch">New to Brightloop? <a href="/signup">Create an account</a></p></AuthShell>;
}

function SignupPage() {
  const [form, setForm] = useState({ name: '', business: '', email: '', password: '', confirm: '' }); const [terms, setTerms] = useState(false); const [message, setMessage] = useState('');
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  function submit(e) { e.preventDefault(); const strong = form.password.length > 8 && /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password); if (!strong) return setMessage('Please meet all password requirements before continuing.'); if (form.password !== form.confirm) return setMessage('Your passwords do not match.'); if (!terms) return setMessage('Please accept the Terms and Conditions to continue.'); setMessage('The registration interface is ready. Connect your signup API to create accounts.'); }
  return <AuthShell><div className="auth-heading"><span className="auth-step">GET STARTED</span><h2>Create your account</h2><p>Start exploring business software with Brightloop.</p></div><form className="auth-form signup-form" onSubmit={submit}><div className="field"><label htmlFor="signup-name">Full name</label><input id="signup-name" value={form.name} onChange={update('name')} placeholder="Your full name" autoComplete="name" required /></div><div className="field"><label htmlFor="signup-business">Business name</label><input id="signup-business" value={form.business} onChange={update('business')} placeholder="Your company name" autoComplete="organization" required /></div><div className="field"><label htmlFor="signup-email">Work email</label><input id="signup-email" type="email" value={form.email} onChange={update('email')} placeholder="you@company.com" autoComplete="email" required /></div><PasswordInput label="Create password" value={form.password} onChange={update('password')} placeholder="Create a strong password" autoComplete="new-password" showRequirements /><PasswordInput label="Confirm password" value={form.confirm} onChange={update('confirm')} placeholder="Enter your password again" autoComplete="new-password" /><label className="check-label terms-check"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span className="custom-check"></span><span>I agree to the <a href="/#contact">Terms and Conditions</a> and <a href="/#contact">Privacy Policy</a>.</span></label><button className="button button-primary button-full" type="submit">Create account <Icon name="arrow" size={17} /></button><AuthMessage>{message}</AuthMessage></form><p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p></AuthShell>;
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('');
  function submit(e) { e.preventDefault(); setMessage('Your form is ready. Connect your password-reset API to send a reset link.'); }
  return <AuthShell><div className="auth-heading"><span className="auth-step">ACCOUNT RECOVERY</span><h2>Forgot your password?</h2><p>No worries. Enter your account email to get started with a password reset.</p></div><form className="auth-form" onSubmit={submit}><div className="field"><label htmlFor="reset-email">Email address</label><input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" required /></div><button className="button button-primary button-full" type="submit">Send reset link <Icon name="arrow" size={17} /></button><AuthMessage>{message}</AuthMessage></form><p className="auth-switch"><a className="back-to-login" href="/login">← Back to sign in</a></p></AuthShell>;
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  useEffect(() => { const title = path === '/login' ? 'Sign in | Brightloop' : path === '/signup' ? 'Create account | Brightloop' : path === '/forgot-password' ? 'Reset password | Brightloop' : 'Brightloop Software — Smarter software for every business'; document.title = title; }, [path]);
  if (path === '/login') return <LoginPage />;
  if (path === '/signup') return <SignupPage />;
  if (path === '/forgot-password') return <ForgotPasswordPage />;
  return <LandingPage />;
}
