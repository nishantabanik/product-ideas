import { Icon } from "../components/icons";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="login">
      <form action="/api/login" method="post" className="card page stack">
        <div className="brand" style={{ padding: 0 }}><span className="logo"><Icon name="chart" size={18} /></span>Li X Analyzer</div>
        <label className="field"><span>Password</span><input className="input" id="password" name="password" type="password" autoFocus required /></label>
        {error && <p className="warn" style={{ margin: 0 }}>Wrong password, try again.</p>}
        <button className="btn">Log in</button>
      </form>
    </div>
  );
}
