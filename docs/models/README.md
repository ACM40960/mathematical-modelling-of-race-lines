# F1 Racing Line Models Documentation

This directory contains detailed mathematical documentation for the racing line optimization models implemented in our F1 trajectory planning application.

## Available Models

### 1. Physics-Based Model 
**📄 [physics-based-model.md](./physics-based-model.md)**

- **Approach**: Direct physics calculations with single-pass optimization
- **Track Usage**: 80% (professional level)
- **Parameters**: 5 basic vehicle parameters (mass, acceleration, steering, drag, downforce)
- **Speed**: Fast single calculation
- **Use Case**: Real-time applications, educational purposes

### 2. Kapania Two Step Algorithm
**📄 [kapania-two-step-algorithm.md](./kapania-two-step-algorithm.md)**

- **Approach**: Iterative convex optimization (Stanford research)
- **Track Usage**: 85% (research-grade accuracy) 
- **Parameters**: 8 advanced vehicle dynamics parameters
- **Speed**: Multi-iteration convergence (3-4 iterations)
- **Use Case**: Research applications, professional simulators

## Model Comparison

| Feature | Physics-Based | Kapania Two Step |
|---------|---------------|------------------|
| **Mathematical Base** | Direct physics equations | Optimal control theory |
| **Optimization** | Single-pass | Iterative convex optimization |
| **Accuracy** | 80% track usage | 85% track usage |
| **Speed** | Immediate | 3-4 iterations |
| **Parameters** | 5 basic | 8 advanced |
| **Best For** | Real-time, education | Research, precision |

## Implementation Notes

- **Backend Location**: `Backend/simulation/algorithms/`
- **Frontend Integration**: Both models available in dropdown selection
- **Parameter Management**: UI shows model-specific parameters
- **Hardcoded Values**: Track width and discretization handled in backend

## Research References

### Physics-Based Model
- Oxford University Formula One optimization research
- Classical vehicle dynamics principles
- Direct application of physics equations

### Kapania Two Step Algorithm  
- Kapania, N. R., Subosits, J., & Gerdes, J. C. (2016)
- Stanford University autonomous vehicle research
- Convex optimization theory application

## Usage Guidelines

### Choose Physics-Based Model When:
- ✅ Real-time performance is critical
- ✅ Simple vehicle parameters are sufficient
- ✅ Educational or demonstration purposes
- ✅ Quick iteration and testing needed

### Choose Kapania Two Step When:
- ✅ Maximum accuracy is required
- ✅ Advanced vehicle dynamics modeling needed
- ✅ Research or professional simulation application
- ✅ Computational time is less critical than precision

---

*For implementation details, mathematical derivations, and parameter explanations, refer to the individual model documentation files above.*