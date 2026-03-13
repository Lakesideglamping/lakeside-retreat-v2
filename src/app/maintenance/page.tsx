export default function MaintenancePage() {
  return (
    <html lang="en">
      <head>
        <title>Coming Soon – Lakeside Retreat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Georgia, serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            background: #f5f0eb;
            color: #2c2c2c;
            padding: 2rem;
          }
          .container { max-width: 560px; }
          h1 {
            font-size: 2.8rem;
            font-weight: 400;
            color: #1a3a3a;
            margin-bottom: 1rem;
            letter-spacing: 0.02em;
          }
          p {
            font-size: 1.15rem;
            color: #5a5a5a;
            line-height: 1.8;
            margin-bottom: 0.75rem;
          }
          .divider {
            width: 60px;
            height: 2px;
            background: #7a9e9f;
            margin: 1.5rem auto;
          }
          a {
            color: #1a3a3a;
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Lakeside Retreat</h1>
          <div className="divider" />
          <p>We&rsquo;re putting the finishing touches on our new website.</p>
          <p>We&rsquo;ll be back very soon.</p>
          <div className="divider" />
          <p>
            In the meantime, contact us at{" "}
            <a href="mailto:info@lakesideretreat.co.nz">
              info@lakesideretreat.co.nz
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
