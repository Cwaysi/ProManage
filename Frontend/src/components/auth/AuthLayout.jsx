import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

const FEATURES = [
  'Track every project from kickoff to delivery',
  'Assign tasks and follow team activity in real time',
  'Keep stakeholders and sponsors in the loop',
];

export default function AuthLayout({ children }) {
  return (
    <div className="auth-wrap">
      {/* Brand panel */}
      <div className="auth-hero">
        <div className="auth-hero-grid" />
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <RocketLaunchRoundedIcon />
          </span>
          ProManage
        </div>

        <div className="auth-hero-copy">
          <h1>
            Manage projects, <br />
            track progress, <br />
            <span style={{ textDecoration: 'underline' }}>deliver on time.</span>
          </h1>
          <p>
            The simple project management workspace for teams that want great
            results without the complexity.
          </p>
          <div className="auth-features">
            {FEATURES.map((f) => (
              <div className="auth-feature" key={f}>
                <CheckCircleRoundedIcon fontSize="small" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo-mobile">
            <span className="auth-brand-mark">
              <RocketLaunchRoundedIcon fontSize="small" />
            </span>
            ProManage
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}