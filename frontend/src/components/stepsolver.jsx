import MathText from "./Mathtext"
import SolutionGraph from "./graphview"


export default function StepsSolver({ result }) {
  if (!result) return null 
  const { problem_type,language_detected,confidence,low_confidence,steps=[],final_answer , graph } = result
  return (
     
    <div className="solution-card">
      <div className="solution-header">
        <span className="badge">{problem_type}</span>
        <span className="badge badge-muted">{language_detected}</span>
        {typeof confidence === 'number' && (
          <span className={`badge ${low_confidence ? 'badge-warning' : 'badge-success'}`}>
            confiance: {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      {low_confidence && (
        <p className="warning-text">
          ⚠️ Le modèle n'est pas totalement sûr de cette réponse, vérifie le résultat.
        </p>
      )}

      <ol className="solution-steps">
        {steps.map((step) => (
          <li key={step.step}>
            <MathText>{step.explanation}</MathText>
            {step.formula && <MathText>{step.formula}</MathText>}
            {step.result && (
              <p className="step-result">
                <MathText inline>{step.result}</MathText>
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="final-answer">
        <strong>Réponse finale : </strong>
        <MathText inline>{final_answer}</MathText>
      </div>

      <SolutionGraph graph={graph} />
    </div>
  )
}
