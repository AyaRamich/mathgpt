import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { MathJaxContext} from 'better-react-mathjax'
import './index.css'
import App from './App.jsx'

const mathJaxConfig={ 
  loader: {load: ['[tex]/html']}, 
  tex: { 
    packages: { '[+]':['html']},
     inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  }
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MathJaxContext config={mathJaxConfig}>
      <App />
    </MathJaxContext>
  </StrictMode>
)