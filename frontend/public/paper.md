Nitin R. Kapania ∗
School of Mechanical Engineering
Stanford University
Stanford, CA 94305
nkapania@stanford.edu
John Subosits
School of Mechanical Engineering
Stanford University
Stanford, CA 94305
subosits@stanford.edu
J. Christian Gerdes
School of Mechanical Engineering
Stanford University
Stanford, CA 94305
gerdes@stanford.edu
ABSTRACT
The problem of maneuvering a vehicle through a race course
in minimum time requires computation of both longitudinal
(brake and throttle) and lateral (steering wheel) control inputs.
Unfortunately, solving the resulting nonlinear optimal control
problem is typically computationally expensive and infeasible for
real-time trajectory planning. This paper presents an iterative
algorithm that divides the path generation task into two sequen-
tial subproblems that are significantly easier to solve. Given an
initial path through the race track, the algorithm runs a forward-
backward integration scheme to determine the minimum-time
longitudinal speed profile, subject to tire friction constraints.
With this speed profile fixed, the algorithm updates the vehicle’s
path by solving a convex optimization problem that minimizes the
resulting path curvature while staying within track boundaries
and obeying affine, time-varying vehicle dynamics constraints.
This two-step process is repeated iteratively until the predicted
lap time no longer improves. While providing no guarantees of
convergence or a globally optimal solution, the approach per-
forms well when tested on the Thunderhill Raceway course in
Willows, CA. The lap time reaches a minimum value after only
three iterations, with each iteration over the full 5 km race course
requiring only thirty seconds of computation time on a laptop
computer. The resulting vehicle path and speed profile match
very well with a nonlinear gradient descent solution and a path
driven by a professional racecar driver, indicating that the pro-
posed method is a viable option for online trajectory planning in
the near future.

∗Address all correspondence to this author.
INTRODUCTION
The problem of calculating the minimum lap time trajectory
for a given vehicle and race track has been studied over the last
several decades in the control, optimization, and vehicle dynam-
ics communities. Early research by Hendrikx et al.. [1] in 1996
used Pontryagin’s minimum principle to derive coupled differ-
ential equations to solve for the minimum-time trajectory for a
vehicle lane change maneuver. The minimum lap time prob-
lem drew significant interest from professional racing teams, and
Casanova [2] published a method in 2000 capable of simultane-
ously optimizing both the path and speed profile for a fully non-
linear vehicle model using nonlinear programming (NLP). Kel-
ley [3] further extended the results from Casanova to consider
transient vehicle dynamics and tire thermodynamics.
More recently, the development of autonomous vehicle tech-
nology at the industry and academic level has led to research
on optimal path planning algorithms that can be used for driver-
less cars. Theodosis and Gerdes published a gradient descent ap-
proach for determining time-optimal racing lines, with the racing
line constrained to be composed of a fixed number of clothoid
segments [4]. Given the computational expense of performing
nonlinear optimization, there has also been a significant research
effort to find approximate methods that provide fast lap times.
Timings and Cole [5] formulated the minimum lap time problem
into a model predictive control (MPC) problem by linearizing the
nonlinear vehicle dynamics at every time step and approximat-
ing the minimum time objective by maximizing distance trav-
eled along the path centerline. Gerdts et al. [6] proposed a simi-
lar receding horizon approach, where distance along a reference
DSCC2015-
Proceedings of the ASME 2015 Dynamic Systems and Control Conference
DSCC
October 28-30, 2015, Columbus, Ohio, USA
path was maximized over a series of locally optimal optimization
problems that were combined with continuity boundary condi-
tions. One potential drawback of the model predictive control
approach is that an optimization problem must be reformulated
and solved at every time step, which can still be computationally
expensive. For example, Timings and Cole reported a computa-
tion time of 920 milliseconds per 20 millisecond simulation step
on a desktop PC.

In general, the aforementioned methods are still feasible for
experimental implementation. As demonstrated in [7], an au-
tonomous vehicle can apply a closed-loop controller to follow
a time-optimal vehicle trajectory computed offline. However,
there are significant benefits to developing a fast trajectory gen-
eration algorithm that can approximate the globally optimal tra-
jectory. If the algorithm runtime is small compared to the actual
lap time, the algorithm can run as a real-time trajectory planner
and find a fast racing line for the next several turns of the racing
circuit. This would allow the trajectory planner to modify the
desired path based on estimates of road friction, tire wear, en-
gine/brake dynamics and other parameters learned over several
laps of racing. Additionally, the fast trajectory algorithm can be
used to provide a very good initial trajectory for a nonlinear op-
timization method.

This paper therefore presents an iterative algorithm that
generates vehicle racing trajectories with low computational
expense. To speed up computation time, the combined lat-
eral/longitudinal optimal control problem is replaced by two
sequential sub-problems where minimum-time longitudinal
speed inputs are computed given a fixed vehicle path, and then
the vehicle path is updated given the fixed speed commands. The
following section presents a mathematical framework for the
overall trajectory generation problem and provides a linearized
five-state model for the planar dynamics of a racecar following
a set of speed and steering inputs, with lateral and heading error
states computed with respect to a fixed path. The next section
describes the method of finding the minimum time speed inputs
given a fixed path. While this sub-problem has been recently
formulated as a convex optimization problem [8], a forward-
backward integration scheme based on prior work [9] is used
instead. Next, the paper describes a method for updating the
racing path given the fixed speed inputs using convex optimiza-
tion, where the curvature norm of the driven path is explicitly
minimized. The last section presents the final algorithm and
compares results generated on the Thunderhill Raceway circuit
in Willows, CA to results from both a nonlinear optimization
and data recorded from a professional racecar driver. The paper
concludes by discussing future implementation of the algorithm
in a real-time path planner.

Figure 1. (a) View of a sample reference path and road boundaries,
plotted in the East-North Cartesian frame (b) Lateral distance from path to
inside road edge (positive) and outside road edge (negative) as a function
of distance along path. (c) Curvature as a function of distance along path.
PATH DESCRIPTION AND VEHICLE MODEL
Figure 1 describes the parameterization of the reference path
that the vehicle will follow. The reference path is most intu-
itively described in Fig. 1a as a smooth curve of Cartesian East-
North coordinates, with road boundaries represented by similar
Cartesian curves. However, for the purposes of quickly gener-
ating a racing trajectory, it is more convenient to parameterize
the reference path as a curvature profileKthat is a function of
distance along the paths(Fig. 1c). Additionally, it is convenient
to store the road boundary information as two functionswin(s)
andwout(s), which correspond to the lateral distance from the
path atsto the inside and outside road boundaries, respectively
(Fig. 1b). This maximum lateral distance representation will be
useful when constraining the generated racing path to lie within
the road boundaries. The transformation from the locals,Kco-
ordinate frame to the global Cartesian coordinatesE,Nare given
by the Fresnel integrals:
Figure 2. (a) Schematic of bicycle model. (b) Diagram showing lateral
path deviationeand path heading error∆Ψstates.

E(s) =
∫s
0
−sin(Ψr(z))dz (1a)
N(s) =
∫s
0
cos(Ψr(z))dz (1b)
Ψr(s) =
∫s
0
K(z)dz (1c)
whereΨr(s)is the heading angle of the reference path. With the
reference path defined in terms ofsandK, the next step is to
define the dynamic model of the vehicle. For the purposes of tra-
jectory generation, we assume the vehicle dynamics are given by
the planar bicycle model (Fig. 2a), with yaw raterand sideslipβ
states describing the lateral dynamics. Additionally, the vehicle’s
offset from the reference path is given by the path lateral devia-
tion stateeand path heading error state∆Ψ(Fig. 2b). Equations
of motion for all four states are given by:

β ̇=Fyf+Fyr
mUx(t)
−r r ̇=
aFyf−bFyr
Iz
(2a)
e ̇=Ux(β+∆Ψ) ∆Ψ ̇=r−UxK (2b)
whereUxis the vehicle forward velocity andFyfandFyrare the
front and rear lateral tire forces. The vehicle mass and yaw iner-
tia are denoted bymandIz, and the geometric parametersaand
bare shown in Fig. 2a. Note that while the vehicle longitudi-
nal dynamics are not explicitly modeled, the bicycle model does
allow for time-varying values ofUx.

VELOCITY PROFILE GENERATION GIVEN FIXED
REFERENCE PATH
Given a fixed reference path described bysandK, the first
algorithm step is to find the minimum time speed profile the ve-
hicle can achieve without exceeding the available tire-road fric-
tion. The approach taken in this paper is a “three-pass” approach
described in complete detail by Subosits and Gerdes [9], and
originally inspired by work from Velenis et al.. [10]. Given the
lumped front and rear tires from Fig. 2a, the available longitu-
dinal forceFxand lateral forceFyat each wheel is given by the
friction circle constraint:
Fxf^2 +Fyf^2 ≤(μFzf)^2 (3a)
Fxr^2 +Fyr^2 ≤(μFzr)^2 (3b)
whereμis the tire-road friction coefficient andFzis the available
normal force at the tire. The method described in [9] determines
the normal and lateral tire forcesFzandFyat each point along the
path by accounting for factors such as longitudinal weight trans-
fer and three-dimensional topography effects (e.g. road bank and
grade). However, for this paper, we will consider only the pri-
mary effects of road curvature, vehicle speed, and static weight
distribution. The first pass of the speed profile generation aims to
find the maximum permissible steady state vehicle speed given
zero longitudinal force. This is given by:
Ux(s) =
√
μg
|K(s)|
(4)
where the result in (4) is obtained by settingFyf=amb+bUx^2 Kand
Fzf=mgba+b. The results of this first pass for the sample curva-
ture profile in Fig. 3a are shown in Fig. 3b. The next step is
a forward integration step, where the velocity of a given point is
determined by the velocity of the previous point and the available
longitudinal forceFx,maxfor acceleration. This available longi-
tudinal force is calculated in [9] by accounting for the vehicle
engine force limit and the lateral force demand on all tires due to
the road curvature:
Ux(s+∆s) =
√
Ux(s)+ 2
Fx,accel,max
m
∆s (5)
A key point of the forward integration step is that at every point,
the value ofUx(s)is compared to the corresponding value from
(4), and the minimum value is taken. The result is shown graph-
ically in Fig. 3c. Finally, the backward integration step occurs,
where the available longitudinal force for deceleration is con-
Figure 3. (a) Sample curvature profile. (b) Velocity profile given zero
longitudinal force. (c) Velocity profile after forward pass (d) Final velocity
profile after backward pass.

strained by the lateral force demand at both tires:

Ux(s−∆s) =
√
Ux(s)− 2
Fx,decel,max
m
∆s (6)
The value ofUx(s)is then compared to the corresponding value
from (5) for each point along the path, and the minimum value is
chosen, resulting in the final velocity profile shown by the solid
line in Fig. 3d.

UPDATING PATH GIVEN FIXED VELOCITY PROFILE
Overall Approach and Minimum Curvature Heuristic
The second step of the trajectory generation algorithm takes
the original reference pathK(s)and corresponding velocity pro-
fileUx(s)as inputs, and modifies the reference path to obtain a
new, ideally faster, racing line. Sharp [11] suggests a general ap-
proach for modifying an initial path to obtain a faster lap time
by taking the original path and velocity profile and incrementing

the speed uniformly by a small, constant “learning rate.” An opti-
mization problem is then solved to find a new reference path and
control inputs that allow the vehicle to drive at the higher speeds
without driving off the road. If a crash is detected, the speed in-
puts are locally reduced around the crash site and the process is
repeated.
However, one challenge with this approach is that it can
take several hundred iterations of locally modifying the vehi-
cle speed profile, detecting crashes, and modifying the reference
path to converge to a fast lap time. An alternative approach is
to minimize the norm of the vehicle curvatureK(s)at each path
modification step. Intuitively, as the speed profile increases, the
reference path will need to be modified to have lower peak cur-
vature values in order to avoid saturating the lateral force ca-
pabilities of the tire. However, the minimum curvature path is
not, in general, the minimum time path. In general, the mini-
mum time path must tradeoff between the competing objectives
of minimizing the path curvature to increase cornering speed,
while also shortening the overall length of the path.
Convex Problem Formulation
Formulating the path update step as a convex optimization
problem requires an affine, discretized form of the bicycle model
presented earlier. The equations of motion in (2) are already lin-
earized, but the front and rear lateral tire forces become saturated
as the vehicle drives near the limits of tire adhesion. The well-
known brush tire model [12] captures the force saturation of tires
as a function of lateral tire slip angleαas follows:
Fy?=





−C?tanα?+ C
?^2
3 μFz?|tanα?|tanα?
− C
(^3)?
27 μ^2 Fz^2 ?tan
(^3) α?, |α?|<arctan
(
3 μFz?
C?
)
−μFz?sgnα?, otherwise
(7)
where the symbol?∈[f,r]denotes the lumped front or rear tire,
andC?is the corresponding tire cornering stiffness. The lin-
earized tire slip anglesαfandαrare functions of the vehicle
lateral states and the steer angle input,δ:
αf=β+
ar
Ux
−δ (8a)
αr=β−
br
Ux
(8b)
The brush tire model in (7) can be linearized at every point along
the reference path assuming steady state cornering conditions:
Fy?=F ̃y?−C ̃?(α?−α ̃?) (9a)
F ̃y?=Fz?
g
Ux^2 K (9b)

Figure 4. Nonlinear tire force curve given by Fiala model, along with
affine tire model linearized atα=α ̃.

with parametersF ̃y,α ̃andC ̃shown in Fig. 4. The affine, con-
tinuous bicycle model with steering inputδis then written in
state-space form as:

x ̇(t) =A(t)x+B(t)δ+d(t) (10a)
x= [e ∆Ψ r β Ψ]T (10b)
where we have added a fifth state, vehicle heading angleΨ, de-
fined as the time integral of yaw rater. This makes explicit com-
putation of the minimum curvature path simpler. The state ma-
tricesA(t),B(t), andd(t)are given by:

A(t) =
      
0 Ux(t) 0 Ux(t) 0
0 0 1 0 0
0 0 −(a
(^2) C ̃f(t)+b (^2) C ̃r(t))
Ux(t)Iz
bC ̃r(t)−aC ̃f(t)
Iz^0
0 0 b
C ̃r(t)−aC ̃f(t)
mUx^2 (t) −^1
−(C ̃f(t)+C ̃r(t))
mUx(t)^0
0 0 0 1 0

      
(11)
B(t) = [0 0
aC ̃f(t)
Iz
C ̃f(t)
mUx(t)
0 ]T (12)
d(t) =
      
0
−K(t)Ux(t)
aC ̃f(t)α ̃f(t)−bC ̃r(t)α ̃r(t)+aF ̃yf(t)−bF ̃yr(t)
Iz
C ̃f(t)α ̃f(t)+C ̃r(t)α ̃r(t)+F ̃yf(t)+F ̃yr(t)
mUx(t)
0
      
(13)
The state matrices in (11) are functions of time, not distance
along the paths. Time as a function of distance along the path
t(s)is obtained by computing the integral:
t(s) =
∫s
0
dz
Ux(z)
(14)
With the nonlinear model now approximated as an affine, time-
varying model, updating the path is accomplished by solving the
following convex optimization problem:
minimize ∑
k
(
Ψk−Ψk− 1
sk−sk− 1
) 2
(15a)
subject to xk+ 1 =Akxk+Bkδk+dk (15b)
woutk ≤ek≤wink (15c)
∣
∣
∣βk+Uarxk,k−δk
∣
∣
∣≤αf,max (15d)
∣
∣
∣βk−
brk
Ux,k
∣
∣
∣≤αr,max (15e)
|δk−δk− 1 |≤δslew (15f)
wherek= 1 ...Tis the discretized time index, andAk,Bk, anddk
are discretized versions of the continuous state-space equations
in (10). The objective function (15a) minimizes the curvature
norm of the path driven by the vehicle, as path curvature is the
derivative of the vehicle heading angle with respect to distance
along the paths(1c). To maintain convexity of the objective
function, the termsk−sk− 1 is a constant rather than a variable,
and is updated for the next iteration after the optimization has
been completed (see following section).
The equality constraint (15b) ensures the vehicle follows the
affine lateral dynamics. The inequality constraint (15c) allows
the vehicle to deviate laterally from the reference path to find
a new path with lower curvature, but only up to the road edges.
The inequality constraints (15d) and (15e) ensure that the vehicle
does not exceed the peak force capability of the tires, and (15f)
imposes a slew rate limit on the steering actuator. The results
of running the optimization are shown for an example turn in
Fig. 5. The reference path starts out at the road centerline, and
the optimization finds a modified path that uses all the available
width of the road to lower the path curvature.
ALGORITHM IMPLEMENTATION AND RESULTS
Algorithm Implementation
The final algorithm for iteratively generating a vehicle rac-
ing trajectory is described in Fig. 6. The input to the algorithm
is any initial path through the racing circuit, parameterized in
terms of distance along the paths, path curvatureK(s), and the
Figure 5. Path update for an example turn.
lane edge distanceswin(s)andwout(s)described in Fig. 1. Given
the initial path, the minimum time speed profileUx(s)is calcu-
lated as described in Fig. 3. Next, the path is modified by solving
the previously described minimum curvature convex optimiza-
tion problem (15).
The optimization only solves explicitly for the steering in-
putδ?and resulting vehicle lateral statesx?at every time step.
Included withinx?is the optimal vehicle headingΨ?and lateral
deviatione?from the initial path. (Note that?here refers to an
optimal variable assignment, not to be confused with the nota-
tion in (7)). To obtain the new path in terms ofsandK, the
East-North coordinates (Ek,Nk) of the updated vehicle path are
updated as follows:

Ek←Ek−e?kcos(Ψr,k) (16a)
Nk←Nk−e?ksin(Ψr,k) (16b)
whereΨris the path heading angle of the original path. Next, the
new path is given by the following numerical approximation:

sk=sk− 1 +
√
(Ek−Ek− 1 )^2 +(Nk−Nk− 1 )^2 (17a)
Kk=
Ψ?k−Ψ?k− 1
sk−sk− 1
(17b)
Notice that (17b) accounts for the change in the total path
length that occurs when the vehicle deviates from the original
path. In addition tosandK, the lateral distances to the track
edgeswinandwoutare different for the new path as well, and
are recomputed using the Cartesian coordinates for the inner and

1:procedureGENERATETRAJECTORY(s^0 ,K^0 ,w^0 in,w^0 out)
2: path←(s^0 ,K^0 ,w^0 in,w^0 out)
3: while∆t?<εdo
4: Ux←calculateSpeedProfile(path)
5: path←minimizeCurvature(Ux,path)
6: t?←calculateLapTime(Ux,path)
7: end while
8: returnpath,Ux
9:end procedure
Figure 6. Iterative algorithm for fast generation of vehicle trajectories.
Each iteration consists of a sequential two-step approach where the ve-
locity profile is generated given a fixed path and then the path is updated
based on the solution from a convex optimization problem.
outer track edges and (Ek,Nk). The two-step procedure is iterated
until the change in lap time∆t?from the prior iteration is greater
than a small positive constantε. Note that a positive value of
∆t?indicates the current iteration yields a slower lap time com-
pared to the prior iteration. Recall that this is possible given that
we have no guarantees of convergence, and that the minimum
curvature solution is not necessarily the minimum time solution.
Algorithm Validation
The proposed algorithm is tested on the 5 km Thunderhill
racing circuit in Willows, California, USA. The vehicle parame-
ters used for the lap time optimization come from an Audi TTS
experimental race vehicle, with relevant parameters shown in Ta-
ble 1. The initial path is obtained by collecting GPS data of the
inner and outer track edges and estimating the (s,K,win,wout)
parametrization of the track centerline.
The algorithm is implemented in MATLAB, with the mini-
mum curvature optimization problem (15) solved using the CVX
software package [13]. For the purpose of simplicity, topography
effects such as bank and grade were neglected.
Comparison with Other Methods
The generated racing path after four iterations is shown in
Fig. 7. To validate the proposed algorithm, the racing line is com-
pared with results from a nonlinear gradient descent algorithm
implemented by Theodosis and Gerdes [4] and an experimen-
tal trajectory recorded from a professional racecar driver. While
time-intensive to compute, the gradient descent approach gener-
ates racing lines with autonomously driven lap times within one
second of lap times measured from professional racecar drivers.
In general, the two-step method provides a racing line that
is very similar to the line from the gradient descent method and
the human experimental data. However, several interesting dis-
crepancies are plotted in Fig. 8 and Fig. 9 for zoomed-in portions
of the race track. The discrepancies arise because the nonlinear
method balances the tradeoff between a minimum curvature path
Table 1. Optimization Parameters
Parameter Symbol Value Units
Vehicle mass m 1500 kg
Yaw Inertia Iz 2250 kg·m^2
Front axle to CG a 1.04 m
Rear axle to CG b 1.42 m
Front cornering stiffness CF 160 kN·rad−^1
Rear cornering stiffness CR 180 kN·rad−^1
Friction Coefficient μ 0.95 −
Path Discretization ∆s 2.75 m
Optimization Time Steps T 1843 -
Max Engine Force - 3750 N
Figure 7. Overhead view of Thunderhill Raceway park along with gen-
erated path from algorithm. Car drives in indicated direction around the
closed circuit. Labeled regions a-d will be discussed in more detail.

and the path with shortest total distance, and finds regions where
it may be beneficial to use less of the available road width or
drive a higher curvature path in order to reduce the total distance
traveled. However, like most nonlinear racing line optimization
techniques, the method in [4] is only guaranteed to converge to

Figure 8. Racing lines from the two-step fast generation approach, non-
linear gradient descent algorithm, and experimental data taken from pro-
fessional driver. Arrows indicate direction of path. Labeled regions a-b
correspond to zoomed-in locations on Fig. 7.
a locally minimal solution. Interestingly, in both b and c ,
the two-step method provides a closer match to the professional
driver, while the gradient descent solution matches the profes-
sional driver better in a. For the case of d , both numerical
methods provide similar results, but this result is different from
the path chosen by the human driver.
To further compare the path generation methods, Fig. 10
shows the path curvature profileK(s)for both algorithms. Again,
the curvature profiles look similar, with small discrepancies
arounds=900m,s=1100m ands=1400m. The piecewise
linear nature of the nonlinear gradient descent method is due to
the clothoid constraint imposed by [4]. The resulting velocity
Figure 9. Racing lines from the two-step fast generation approach, non-
linear gradient descent algorithm, and experimental data taken from pro-
fessional driver. Arrows indicate direction of path. Labeled regions c-d
correspond to zoomed-in locations on Fig. 7.

profiles are shown in Fig. 11 for the two-step method and gradi-
ent descent method. Interestingly, the gradient descent method
is able to achieve higher cornering speeds, although the two-step
method is able to gain a speed advantage by having the vehicle
accelerate earlier after a turn is finished.

Lap Time Convergence and Computation Time
Fig. 12 shows the predicted lap time for each iteration of
the two-step algorithm, with step 0 corresponding to the race
track centerline. While the lap time can be estimated by (14),

Figure 10. Curvature profileK(s)plotted vs. distance along the paths.
For improved visibility, results are shown for the first 2 km of the track.
Figure 11. Velocity profileUx(s)plotted vs. distance along the paths
for the two-step method and nonlinear gradient descent method.
we obtained a more precise lap time by numerically simulating a
vehicle following the desired path and velocity profile using the
feedback-feedforward control formulation presented in [7]. The
equations of motion are the nonlinear versions of (2) with tire
forces given by the brush tire model in (7). The benefit of using
the more precise lap time simulation is accounting for the path
tracking dynamics of the vehicle and ensuring the car actually
stays on the track at all times when subjected to a more accurate
vehicle dynamics model. After three iterations, the predicted lap
time achieves a minimum value of 135.0 seconds. The predicted
lap time on the fourth iteration degrades slightly to 135.3 sec-
onds, at which the algorithm terminates. The minimum lap time
is similar to the predicted lap time of 135.5 seconds from the
nonlinear gradient descent approach, although in reality, the ac-
tual experimental lap time achieved will depend significantly on
factors such as three-dimensional path topography and engine
dynamics.
The primary benefit of the proposed algorithm is not im-
proved lap time performance over the nonlinear algorithm but
rather a radical improvement in computational simplicity and
Figure 12. Lap time as a function of iteration for the two-step fast tra-
jectory generation method. Final lap time is comparable to that achieved
with the nonlinear gradient descent approach. Iteration zero corresponds
to the lap time for driving the initial path.

speed. Each two-step iteration of the full course takes only 26
seconds on an Intel i7 processor, whereas the nonlinear algo-
rithm from [4] typically runs over the course of several hours on
the same machine. The most significant computational expense
for the proposed algorithm is solving the convex curvature mini-
mization problem for all 1843 discrete time steps of the race ve-
hicle over the 5 km racing circuit. This computational efficiency
will enable future work to incorporate the trajectory modifica-
tion algorithm as an online “preview” path planner, which would
provide the desired vehicle trajectory for an upcoming portion of
the race track. Since the computation time of the algorithm is
heavily dependent on the preview distance, the high-level plan-
ner would not need to run at the same sample time as the vehicle
controller. Instead, the planner would operate on a separate CPU
and provide a velocity profile and racing line for only the next
1-2 kilometers of the race track every 5-10 seconds, while in-
corporating estimates of the friction coefficient and other vehicle
parameters learned over several laps of racing.

CONCLUSION
This paper demonstrates an iterative algorithm for quickly
generating vehicle racing trajectories, where each iteration is
comprised of a sequential velocity update and path update step.
Given an initial path through the race track, the velocity up-
date step performs forward-backward integration to determine
the minimum time speed inputs. Holding this speed profile con-
stant, the path geometry is updated by solving a convex opti-
mization problem to minimize path curvature. The trajectory
generated by the algorithm for the Thunderhill Raceway circuit
is comparable to a trajectory from a previously published non-
linear gradient descent algorithm and an experimental trajectory
collected from a professional driver. Future work will apply the

racing trajectory on a vehicle testbed to determine the experi-
mental performance of the algorithm. Finally, an exciting oppor-
tunity for future research is incorporating the trajectory modifi-
cation algorithm into an online path planner to provide preview
trajectories in real time.
ACKNOWLEDGMENT
The authors would like to thank Marcial Hernandez for as-
sistance with fitting an initial curvature profile from GPS point
cloud data, as well as Vincent Laurense, John Kegelman and Ohi
Dibua of the Dynamic Design Laboratory. Kapania and Subosits
are both supported by Stanford Graduate Fellowships.
REFERENCES
[1] Hendrikx, J., Meijlink, T., and Kriens, R., 1996. “Applica-
tion of optimal control theory to inverse simulation of car
handling”.Vehicle System Dynamics, 26 (6), pp. 449–461.
[2] Casanova, D., 2000. “On minimum time vehicle manoeu-
vring: The theoretical optimal lap”.
[3] Kelly, D. P., 2008. “Lap time simulation with transient ve-
hicle and tyre dynamics”.
[4] Theodosis, P. A., and Gerdes, J. C., 2011. “Generating a
racing line for an autonomous racecar using professional
driving techniques”. In Dynamic Systems and Control
Conference, pp. 853–860.
[5] Timings, J. P., and Cole, D. J., 2013. “Minimum maneu-
ver time calculation using convex optimization”. Journal
of Dynamic Systems, Measurement, and Control, 135 (3),
p. 031015.
[6] Gerdts, M., Karrenberg, S., Muller-Beßler, B., and Stock, ̈
G., 2009. “Generating locally optimal trajectories for an
automatically driven car”.Optimization and Engineering,
10 (4), pp. 439–463.
[7] Kritayakirana, K., and Gerdes, J. C., 2012. “Autonomous
vehicle control at the limits of handling”. International
Journal of Vehicle Autonomous Systems, 10 (4), pp. 271–
296.
[8] Lipp, T., and Boyd, S., 2014. “Minimum-time speed opti-
misation over a fixed path”.International Journal of Con-
trol, 87 (6), pp. 1297–1311.
[9] Subosits, J. K., and Gerdes, J. C., 2015. “Autonomous ve-
hicle control for emergency maneuvers: The effect of to-
pography”. In American Control Conference.
[10] Velenis, E., and Tsiotras, P., 2008. “Minimum-time travel
for a vehicle with acceleration limits: Theoretical analysis
and receding-horizon implementation”. Journal of Opti-
mization Theory and Applications, 138 (2), pp. 275–296.
[11] Sharp, R., 2014. “A method for predicting minimum-time
capability of a motorcycle on a racing circuit”. Journal
of Dynamic Systems, Measurement, and Control, 136 (4),
p. 041007.
[12] Pacejka, H. B., 2012. Tire and Vehicle Dynamics, 3rd ed.
Butterworth-Heinemann.
[13] Grant, M., and Boyd, S., 2014. CVX: Matlab soft-
ware for disciplined convex programming, version 2.1.
http://cvxr.com/cvx, Mar.