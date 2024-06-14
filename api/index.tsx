import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import axios from 'axios';
import oracleAbi from '../lib/oracle-abi.json' with { type: "json" };

// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }

export const app = new Frog({
  initialState: {
    mintArguments: null,
    transactionId: null,
  },
  assetsPath: '/',
  basePath: '/api',
  browserLocation: 'https://farcoin.xyz',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

app.transaction('/mint', (c) => {
  const { previousState: { mintArguments } } = c;
  return c.contract({
    abi: oracleAbi,
    chainId: 'eip155:8453',
    functionName: 'verifyAndMint',
    args: mintArguments,
    to: '0x9e78abe45f351257fc7242856a3d4329fcc34722',
  })
});

app.frame('/', async (c) => {
  const { status, deriveState } = c;
  deriveState(previousState => {
    previousState.mintArguments = null;
    previousState.transactionId = null;
  });
  return c.res({
    title: 'Farcoin'
    action: '/check',
    image: (
      <div
        style={{
          alignItems: 'flex-start',
          background: 'linear-gradient(to right, #432889, #17101F)',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            fontWeight: 'bold',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Mint my likes as social currency ⬇️
        </div>
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 32,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            textAlign: 'left',
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Have I liked one of your casts?
        </div>
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 32,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            textAlign: 'left',
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Fides are likes, brought onchain.
        </div>
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontSize: 32,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Liking a cast issues your fides to others.
        </div>
      </div>
    ),
    intents: [
      <Button value="check">Check Eligibility</Button>,
    ],
  });
});


app.frame('/finish', async (c) => {
  const { deriveState, transactionId, status } = c;
  const state = deriveState(previousState => {
    previousState.mintArguments = null;
    previousState.transactionId = transactionId || previousState.transactionId;
  });
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Minted!
        </div>
      </div>
    ),
    intents: [
      <Button.Redirect location={`https://basescan.org/tx/${state.transactionId}`}>View Transaction</Button.Redirect>,
      <Button.Redirect location="https://farcoin.xyz">Visit Farcoin</Button.Redirect>,
      <Button.Redirect location="https://warpcast.com/~/compose?text=Mint%20my%20likes%20on%20Farcoin!&embeds[]=https://frame.farcoin.xyz/api">Share Frame</Button.Redirect>,
    ],
  });
});

app.frame('/check', async (c) => {
  const { buttonValue, inputText, status, frameData, deriveState } = c;

  if (!frameData) {
    return tryAgain(c, '/check');
  }

  const {
    fid: likedFid,
    castId: {
      fid: likerFid,
    }
  } = frameData;
  const likerRes = await axios.get('https://farcoin.xyz/user-by-fid', {
    params: { fid: likerFid }
  });
  const { username: creator } = likerRes.data.result;

  const likedRes = await axios.get('https://farcoin.xyz/user-by-fid', {
    params: { fid: likedFid }
  });
  const { verifications } = likedRes.data.result;
  if (verifications.length === 0) {
    return c.res({
      image: (
        <div
          style={{
            alignItems: 'center',
            background:
              status === 'response'
                ? 'linear-gradient(to right, #432889, #17101F)'
                : 'black',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              fontWeight: 'bold',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            No ETH address linked
          </div>
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 32,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              textAlign: 'left',
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            Go to Settings → Verified Addresses to link one.
          </div>
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 32,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            You'll need to link an address to mint fides.
          </div>
        </div>
      ),
      intents: [
        <Button value="refresh">Try Again</Button>,
      ],
    });
  }
  const likedAddress = verifications[0];
  let n = 0;
  try {
    const oracleRes = await axios.post('https://farcoin.xyz/mint', {
      likerFid,
      likedAddress,
    });
    const { mintArguments } = oracleRes.data.result;
    deriveState(previousState => {
      previousState.mintArguments = mintArguments;
    });
    n = mintArguments[4];
  } catch (e) {
    if (e.response && e.response.data) {
      console.log(likerFid, likedFid, e.response.data);
    } else {
      console.log(e);
    }
  }
  if (n === 0) {
    return c.res({
      image: (
        <div
          style={{
            alignItems: 'center',
            background:
              status === 'response'
                ? 'linear-gradient(to right, #432889, #17101F)'
                : 'black',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: 'white',
                fontSize: 60,
                fontStyle: 'normal',
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                lineHeight: 1.4,
                marginTop: 30,
                padding: '0 120px',
                whiteSpace: 'pre-wrap',
              }}
            >
              No fides to mint from @{creator}
            </div>
            <div
              style={{
                display: 'flex',
                color: 'white',
                fontSize: 32,
                fontStyle: 'normal',
                letterSpacing: '-0.025em',
                lineHeight: 1.4,
                marginTop: 30,
                textAlign: 'left',
                padding: '0 120px',
                whiteSpace: 'pre-wrap',
              }}
            >
              Mint fides from others at farcoin.xyz
            </div>
          </div>
        </div>
      ),
      intents: [
        <Button.Redirect location="https://farcoin.xyz">Visit Farcoin</Button.Redirect>,
        <Button.Redirect location="https://warpcast.com/~/compose?text=Mint%20my%20likes%20on%20Farcoin!&embeds[]=https://frame.farcoin.xyz/api">Share Frame</Button.Redirect>,
      ],
    });
  }
  return c.res({
    action: '/finish',
    image: (
      <div
        style={{
          alignItems: 'center',
          background:
            status === 'response'
              ? 'linear-gradient(to right, #432889, #17101F)'
              : 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              fontWeight: 'bold',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`You've earned ${n} of @${creator}'s' fide${n == 1 ? '' : 's'}`}
          </div>
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 32,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              textAlign: 'left',
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            Mint them below.
          </div>
      </div>
    ),
    intents: [
      <Button.Transaction target="/mint">Mint</Button.Transaction>,
    ],
  });
});

const tryAgain = (c, action) => c.res({
  action,
  image: (
    <div
      style={{
        alignItems: 'center',
        background: 'black',
        backgroundSize: '100% 100%',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        height: '100%',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 60,
          fontStyle: 'normal',
          letterSpacing: '-0.025em',
          lineHeight: 1.4,
          marginTop: 30,
          padding: '0 120px',
          whiteSpace: 'pre-wrap',
        }}
      >
        Error loading frame
      </div>
    </div>
  ),
  intents: [
    <Button value="refresh">Try again</Button>,
  ],
});

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
