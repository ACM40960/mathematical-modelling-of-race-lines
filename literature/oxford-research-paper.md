2 Car and Track Model
The track and car kinematics are modelled using ideas from classical diﬀer-
ential geometry. As was explained in [6], the track description is based on
measured data with the curvature of the track found as the solution of a
subsidiary optimal control problem. The car model is standard and is based
on a rigid-body representation of a chassis with longitudinal, lateral and
3
yaw freedoms. We will use the tyre description given in [2] in combination
with an upgraded aerodynamic model. The important geometric modelling
quantities are shown in plan view in Figure 1.
wr
wf
Mc Cp
xb
yb
b a
bA aA
Figure 1: Plan view of a Formula One car with its basic geometric parameters.
The car mass centre is at Mc, while the centre of pressure is located at Cp.
The body-fixed axes xb and yb are in the ground plane.
2.1 Track Model
We will model the track using a curvilinear coordinate system that follows
the vehicle using the track centre line position as the curvilinear abscissa [4].
Referring to Figure 2, we describe the location of the mass centre of the
vehicle in terms of the curvilinear abscissa s(t) and the vector n(s(t)). The
former quantity defines the distance travelled along the track centre line,
while the latter gives the position of the vehicle’s mass centre in a direction
perpendicular to the track centre-line tangent vector t(s(t)). It is assumed
that the travelled distance s(t) is an increasing function of time, and that
‘time’ and ‘distance’ can be thought of as alternative independent variables.
The standard dot notation will be used to signify derivatives with respect to
time. At any point s the track’s curvature is given by C (the s-dependence
is implied) and its radius of curvature is given by R. The track centre-line
tangent vector t will be described in terms of the track orientation angle θ,
with the track’s half-width given by N . The yaw angle of the vehicle is given
by ψ and the angle between the vehicle and the track by ξ; ψ= θ+ ξ. In
this coordinate system constraints on the track width are easily expressed in
terms of constraints on the magnitude of n.
4
ψ
nx
ξ
ny
θ
R
N
Z
s
Figure 2: Curvilinear-coordinate-based description of a track segment Z.
The independent variable s represents the elapsed centre-line distance trav-
elled, with R(s) the radius of curvature and N (s) the track half-width; nx
and ny represent an inertial reference frame.
It follows by routine calculation [6] that
˙
s=
ucos ξ− vsin ξ
1− nC, (1)
in which u and v are the longitudinal and lateral components of the car’s
velocity. The rate of change of n is given by
˙
n= usin ξ+ vcos ξ. (2)
Diﬀerentiating ψ= ξ+ θ with respect to time results in
˙
ξ=
˙
ψ− C˙
s. (3)
2.1.1 Change of Independent Variable
The ‘distance travelled’ will be used as the independent variable. This has
the advantage of maintaining an explicit connection with the track position,
as well as reducing (by one) the number of problem state variables. Suppose
dt=
dt
dsds= Sf(s)ds,
5
where Sf comes from (1) as follows
Sf=
ds
dt
1
=
1− nC
ucos ξ− vsin ξ. (4)
The quantity Sf is the reciprocal of the component of the vehicle velocity in
the track-tangent direction (on the centre line at s). There follows
dn
ds= Sf (usin ξ+ vcos ξ) (5)
from (2), and
dξ
ds= Sfω− C (6)
from (3); ω=
˙
ψ is the vehicle yaw rate.
2.2 Car Model
Each tyre produces longitudinal and lateral forces that are responsive to the
tyres’ slip; see Appendix A. These forces together with the steer and yaw
angle definitions are given in Figure 3.
Frly
Frlx
ψ
Fflx
u
Ffly
v
Frry
Frrx
δ
nx
Ffrx
Ffry
δ
ny
Figure 3: Tyre force system. The inertial reference frame is shown as nx and
ny.
Balancing forces in the longitudinal and lateral directions, while also bal-
6
ancing the yaw moments, gives
M d
dtu(t) = Mωv+ Fx
M d
dtv(t) =−Mωu+ Fy
d
Iz
dtω(t) = a(cos δ(Ffry + Ffly) + sin δ(Ffrx + Fflx)) +
wf (sin δFfry− cos δFfrx)− wrFrrx +
wf (cos δFflx− sin δFfly) + wrFrlx− b(Frry + Frly), (7)
in which Fx and Fy are the longitudinal and lateral forces, respectively, acting
on the car. These forces are given by
Fx Fy = cos δ(Ffrx + Fflx)− sin δ(Ffry + Ffly) + (Frrx + Frlx) + Fax (8)
= cos δ(Ffry + Ffly) + sin δ(Ffrx + Fflx) + (Frry + Frly) (9)
in which Fax is the aerodynamic drag force. These equations can be expressed
in terms of the independent variable s as follows:
du
ds= Sf(s) ˙ u (10)
dv
ds= Sf(s) ˙ v (11)
dω
ds= Sf(s) ˙ ω. (12)
2.3 Tyre Forces
The tyre forces have normal, longitudinal and lateral components that act
on the vehicle’s chassis at the tyre-ground contact points and react on the
inertial frame. The rear-wheel tyre forces are expressed in the vehicle’s body-
fixed reference frame, while the front tyre forces are expressed in a steered
reference frame; refer again to Figure 3. In each case these forces are a
function of the normal load and the tyre’s longitudinal and lateral slip.
2.3.1 Load Transfer
In order to compute the time-varying tyre loads normal to the ground plane,
we balance the forces acting on the car in the nz direction and balance mo-
ments around the body-fixed xb- and yb-axes; see Figure 1. Balancing the
vertical forces gives
0 = Frrz + Frlz + Ffrz + Fflz + Mg+ Faz, 7
(13)
in which the F z’s are the vertical tyre forces for each of its four wheels, g is
the acceleration due to gravity and Faz is the aerodynamic down force acting
on the car. Balancing moments around the car’s body-fixed xb-axis gives
0 = wr(Frlz− Frrz) + wf(Fflz− Ffrz) + hFy, (14)
in which Fy is the lateral inertial force acting on the car’s mass centre; see
(9). Balancing moments around the car’s body-fixed yb-axis gives
0 = b(Frrz + Frlz)− a(Ffrz + Fflz) + hFx + (aA− a)Faz, (15)
where Fx is the longitudinal inertial force acting on the car’s mass centre (
see (8)), while Faz is the aerodynamic down force.
Equations (13), (14) and (15) are a set of linear equations in four un-
knowns. A unique solution for the tyre loads can be obtained by adding a
suspension-related roll balance relationship, in which the lateral load diﬀer-
ence across the front axle is some fraction of the whole
Ffrz− Fflz= Droll(Ffrz + Frrz− Fflz− Frlz), (16)
where Droll ∈ [0,1].
2.3.2 Non-Negative Tyre Loads
The forces satisfying equations (13), (14), (15) and (16) are potentially both
positive and negative. Negative forces are indicative of vertical reaction
forces, while positive forces are fictitious ‘forces of attraction’. Since the
model being used here has no pitch, roll or heave freedoms, none of the
wheels is free to leave the road, while also keeping faith with (13) to (16).
To cater for the possible ‘positive force’ situation within a nonlinear pro-
gramming environment we introduce the vector
¯
Fz =
   
¯
Ffrz
¯
Fflz
¯
Frrz
¯
Frlz
   , (17)
and define a vector of non-positive loads
¯
Fz = min(
Fz,0); (18)
the minimum function min(·
,·) is interpreted element-wise. It is clear that
¯
¯
Fz and Fz will be equal unless at least one entry of
Fz is positive (i.e. non-
physical). We now argue that the model must respect the laws of mechanics
8
at all times and so equations (13), (14) and (15) must be enforced uncondi-
tionally. In contrast, we assume that the solution to (16), which is only an
approximate representation of the suspension system, can be ‘relaxed’ in the
event of a wheel load sign reversal.
Equations (13), (14) and (15) can be written in matrix form as
A1Fz = c, (19)
while (16) is given by
A2Fz = 0. (20)
In order to deal with the ‘light wheel’ situation, we combine (19) and (20)
A1 0
0 A2
Fz
Fz
¯
=
c
0 , (21)
¯
in which Fz in (20) has been replaced by
Fz. In the situation where all
¯
the wheels are normally loaded,
Fz = Fz and (21) reduces to (13), (14),
(15) and (16). On the other hand, if there is a ‘light wheel’, the mechanics
equations (13), (14) and (15) will be satisfied by the non-positive forces Fz,
¯
while the roll balance equation is satisfied by the now fictitious forces
Fz
that contain a force of attraction. The non-positive forces Fz are used to
represent the normal tyre loads in the rest of the model. It is clear that
¯
the four components of
Fz have to satisfy the nonlinear circularly-dependent
relationship (21), which will be solved by a NLP algorithm.
2.4 Aerodynamic Loads
The external forces acting on the car come from the tyres and from aerody-
namic influences. The aerodynamic force is applied at the centre of pressure,
which is located in the vehicle’s plane of symmetry. The drag and lift forces
are given by
Fax =−0.5 CD(u) ρAu2
, (22)
and
Faz = 0.5 CL(u) ρAu2
, (23)
respectively. The speed-dependent drag and down-force coeﬃcients, and the
speed-dependent location of the aerodynamic centre of pressure are given in
Figure 4.
9
4
3.5
3
2.5
2
1.5
1
0.5
0 20 40 60 80 100
Figure 4: Car aerodynamic maps. The drag coeﬃcient CD is the solid (blue)
curve, which is a function of speed (in m/s). The down-force coeﬃcient CL,
also a function of speed, is given by the dot-dash (red) curve. The speed-
depedent aerodynamic centre of pressure is given by the dashed (magenta)
curve in metres from the front axle. The ‘+’ symbols represent measured
data points.
10
2.5 Wheel Torque Distribution
In order to optimise the vehicle’s performance, one needs to control the
torques applied to the individual road wheels. The braking system applies
equal pressure to the brake callipers on each axle, with the braking pressures
between the front and rear axles satisfying a design ratio. The drive torques
applied to the rear wheels are controlled by a diﬀerential mechanism.
2.5.1 Brakes
We approximate equal brake calliper pressures with equal braking torques
when neither wheel on a particular axle is locked. If a wheel ‘locks up’, the
braking torque applied to the locked wheel may be lower than that applied to
the rolling wheel. For the front wheels this constraint is modelled as follows
0 = max(ωfr,0) max(ωfl,0)(Ffrx− Fflx), (24)
in which ωfr and ωfl are the angular velocities of the front right and front
left wheel, respectively. If either road wheel ‘locks up’, the corresponding
angular velocity will be non-positive and the braking torque constraint (24)
will be inactive.
2.5.2 Diﬀerential
The drive torque is delivered to the rear wheels through a limited-slip diﬀer-
ential, which is modelled by
R(Flrx− Frrx) =−kd(ωlr− ωrr), (25)
in which ωlr and ωrr are the rear-wheel angular velocities, R is the wheel
radius and kd is a torsional damping coeﬃcient. The special cases of an
open- and a locked-diﬀerential correspond to kd = 0 and kd arbitrarily large
respectively. Limited slipping occurs between these extreme
