## Literature Review: Optimal Race Line Modelling

<em>**General Structure followed**

- Introduction
- 1st Research Paper Summary
- 2nd Research Paper Summary
- What we propose to do and how we plan to do it & Conclusion
</em>


Through the course of this project we attempt to understand the impact of different forces on a race car, modelled by a system of equations and thereby we attempt to create an optimal race line for a user drawn race track or predefined F1 race tracks.

We attempt to solve the problem of minimum-lap-time and optimal control  for a Formula One race car is solved using direct transcription and nonlinear programming<sup>[1]</sup>.
The objective is to compute an optimal trajectory, control inputs and setup parameters that together yield the fastest lap, while considering the physical and the dynamic constraints of the car and the track, considering dynamic quantities like friction, temperature etc. This enables the optimization of the racing line, driver controls and the car-specific variables like aerodynamic balance, and suspension stiffness.

Unlike traditional solutions of the race trajectory problem in the form of combined optimal control formulations—where speed, path, and vehicle dynamics are optimized together in computationally demanding nonlinear programming—we adopt a sequential approach<sup>[2]</sup> drawing on Kapania et al. The two-stage methodology divides path planning from speed profiling and allows us to calculate dynamically viable racing lines at a fraction of the computational expense.

The first step is to generate a smooth geometric path with least curvature within track boundaries. The second step overimposes a physically correct speed profile along the path, computed using forward-backward integration, constrained to tire friction and acceleration limits of the vehicle. The system enables rapid iteration, flexibility to different tracks, and potential use in real-time autonomous racing solutions or user-interactive simulation software.

Through this project we aspire to model car dynamics using math modelling using a non-linear ODE system. Improve compute speeds using path-speed decoupling, and provide a user-interactive experience which would enable users to visualize the impact of several factors on the optimal race line.




**References**


1. [Optimal Control for a Formula One Car with
 Variable Parameters](https://ora.ox.ac.uk/objects/uuid%3Ace1a7106-0a2c-41af-8449-41541220809f/files/m776aa23411ad9d78c36f96620a0e0f0b)

- this paper basically represents the basics of all the ODEs to represent factors.

2. [A sequential two-step algorithm for fast generation of vehicle racing trajectories](https://ddl.stanford.edu/sites/g/files/sbiybj25996/files/media/file/
2015_dscc_kapania_sequential_2step_0.pdf)

- this paper is basically an enhancement that basically doesn't calculate the whole track with speed, but splits the process. Creates an optimal track without the speed, and then adds the driver inputs (acceleration/breaks etc)

3. [Computing the Race Line using Bayesian Optimization](https://arxiv.org/abs/2002.04794)
