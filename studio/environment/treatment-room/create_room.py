"""Inkform zen cyberpunk studio. Original geometry/materials, CC0-1.0.
Run: Blender --background --threads 2 --python create_room.py
Blender Z up exports to glTF/Three Y up. Metres, body at world origin.
The maintained scene contains four semantic walls, continuous floor, original bench,
attached architectural glass, three plants and shielded indirect fixtures.
All room illumination is static; body lighting remains independent.
"""
import bpy, math, os, json, time, hashlib, datetime, sys
from mathutils import Vector
HERE=os.path.dirname(os.path.abspath(__file__))
OUTPUT=os.path.abspath(os.path.join(HERE,'..','..','..','output','zen-studio','room'));os.makedirs(OUTPUT,exist_ok=True)
SKIP_PREVIEWS='--skip-previews' in sys.argv
PREVIEW_ONLY='--preview-only' in sys.argv
STARTED=time.monotonic()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
groups={}; current='Room_BackWall'
def mat(name,c,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*c,1)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 return m
wall=mat('Continuous poured mineral concrete',(.74,.73,.69),.94)
stone=mat('Continuous softly honed concrete floor',(.57,.58,.55),.94)
# Broad mineral clouding and fine pores are authored once, then baked.
# No panel grids, artificial tie marks, downloaded textures or runtime noise.
for material,low,high in [(wall,(.67,.66,.62,1),(.80,.79,.75,1)),(stone,(.49,.505,.48,1),(.64,.655,.62,1))]:
 nt=material.node_tree;p=nt.nodes.get('Principled BSDF');coord=nt.nodes.new('ShaderNodeTexCoord')
 noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=.9 if material==stone else 1.7;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.65
 nt.links.new(coord.outputs['Object'],noise.inputs['Vector'])
 ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=low;ramp.color_ramp.elements[1].color=high;nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
 pores=nt.nodes.new('ShaderNodeTexNoise');pores.inputs['Scale'].default_value=110;pores.inputs['Detail'].default_value=2;nt.links.new(coord.outputs['Object'],pores.inputs['Vector'])
 bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.006;nt.links.new(pores.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 if material==stone:
  # Small aggregate variation survives the static color bake; pores remain
  # shallow surface relief rather than scratches, joints or a repeated tile.
  aggregate=nt.nodes.new('ShaderNodeTexNoise');aggregate.inputs['Scale'].default_value=24;aggregate.inputs['Detail'].default_value=2;nt.links.new(coord.outputs['Object'],aggregate.inputs['Vector'])
  fine=nt.nodes.new('ShaderNodeValToRGB');fine.color_ramp.elements[0].color=(.91,.91,.91,1);fine.color_ramp.elements[1].color=(1,1,1,1);nt.links.new(aggregate.outputs['Fac'],fine.inputs[0])
  mix=nt.nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;nt.links.new(ramp.outputs[0],mix.inputs[1]);nt.links.new(fine.outputs[0],mix.inputs[2]);nt.links.new(mix.outputs[0],p.inputs['Base Color'])
  bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.003
# Pale unfinished hinoki-inspired timber. The anisotropic original grain runs
# vertically through every post and slat, using metric world coordinates.
wood=mat('Pale natural vertical-grain timber',(.72,.57,.38),.64)
nt=wood.node_tree;p=nt.nodes.get('Principled BSDF');coord=nt.nodes.new('ShaderNodeTexCoord')
stretch=nt.nodes.new('ShaderNodeVectorMath');stretch.operation='MULTIPLY';stretch.inputs[1].default_value=(34,34,.55);nt.links.new(coord.outputs['Object'],stretch.inputs[0])
grain=nt.nodes.new('ShaderNodeTexNoise');grain.inputs['Scale'].default_value=3;grain.inputs['Detail'].default_value=2;grain.inputs['Roughness'].default_value=.62;nt.links.new(stretch.outputs['Vector'],grain.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.20;ramp.color_ramp.elements[0].color=(.44,.30,.16,1);ramp.color_ramp.elements[1].position=.79;ramp.color_ramp.elements[1].color=(.80,.67,.47,1);nt.links.new(grain.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.10;bump.inputs['Distance'].default_value=.0012;nt.links.new(grain.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],p.inputs['Normal'])
clear_glass=mat('Room glass | physical transmission',(.94,.98,.985),.065)
p=clear_glass.node_tree.nodes.get('Principled BSDF');p.inputs['Transmission Weight'].default_value=1;p.inputs['IOR'].default_value=1.45
clear_glass['roomGlass']=True
planter=mat('Honed warm mineral planters',(.39,.40,.365),.90)
soil=mat('Quiet dark planting substrate',(.055,.065,.045),1)
leaf=mat('Deep living jade broad leaves',(.065,.155,.075),.53)
leaf_light=mat('Soft olive palm foliage',(.12,.235,.095),.58)
leaf_dark=mat('Deep architectural evergreen',(.045,.115,.067),.56)
stem=mat('Natural olive petioles and midribs',(.12,.18,.065),.62)
for material in [leaf,leaf_light,leaf_dark]:
 nt=material.node_tree;p=nt.nodes.get('Principled BSDF');coord=nt.nodes.new('ShaderNodeTexCoord')
 noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=4;noise.inputs['Detail'].default_value=2;nt.links.new(coord.outputs['Object'],noise.inputs['Vector'])
 ramp=nt.nodes.new('ShaderNodeValToRGB');c=material.diffuse_color
 ramp.color_ramp.elements[0].color=tuple(v*.66 for v in c[:3])+(1,);ramp.color_ramp.elements[1].color=tuple(v*1.18 for v in c[:3])+(1,)
 nt.links.new(noise.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
reveal=mat('Muted ice-jade integrated light reveal',(.22,.55,.56),.6)
p=reveal.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(.18,.48,.50,1);p.inputs['Emission Strength'].default_value=.35
def finish(o,name,m,bev=0):
 o.name=name;o.data.materials.append(m);groups.setdefault(current,[]).append(o)
 if bev:
  mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bev;mod.segments=3
  o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 return o
def box(name,loc,size,m,bev=.008):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,m,bev)

graphite=mat('Quiet graphite fixture and glazing metal',(.065,.073,.071),.52,.35)
fixture_shell=mat('Warm mineral powder-coated uplight housing',(.63,.61,.55),.62,.15)
emitter=mat('Recessed warm indirect emitter',(.78,.72,.56),.65)
p=emitter.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(1,.89,.70,1);p.inputs['Emission Strength'].default_value=.7
def cylinder(name,a,b,r,material,vertices=24,bevel=.003):
 a,b=Vector(a),Vector(b);d=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(a+b)/2)
 o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=d.to_track_quat('Z','Y');return finish(o,name,material,bevel)
def ring(name,center,outer,inner,height,material):
 # A real annular rim shields the recessed horizontal emitter from side views.
 x,y,z=center;n=40;verts=[(x+r*math.cos(i*2*math.pi/n),y+r*math.sin(i*2*math.pi/n),z+h) for r,h in [(outer,-height/2),(outer,height/2),(inner,height/2),(inner,-height/2)] for i in range(n)]
 faces=[]
 for k in range(4):
  for i in range(n):faces.append((k*n+i,k*n+(i+1)%n,((k+1)%4)*n+(i+1)%n,((k+1)%4)*n+i))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);return finish(o,name,material)
def upward_disc(name,center,radius):
 x,y,z=center;n=40;verts=[(x,y,z)]+[(x+radius*math.cos(i*2*math.pi/n),y+radius*math.sin(i*2*math.pi/n),z) for i in range(n)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(0,i+1,(i+1)%n+1) for i in range(n)]);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);return finish(o,name,emitter)

# Four semantic walls remain independently switchable. Actual glazed side
# apertures admit diagonal sunlight; their structure belongs to the left wall.
box('Continuous poured concrete back wall',(0,3.053,1.5),(6.14,.14,3),wall,.006)
current='Room_RightWall';box('Right continuous poured concrete wall',(3.054,.25,1.5),(.14,5.64,3),wall,.006)
current='Room_LeftWall'
box('Left rear continuous mineral pier',(-3.054,1.98,1.5),(.14,2.18,3),wall,.006)
box('Left front window pier',(-3.054,-2.47,1.5),(.14,.20,3),wall,.006)
box('Left slender window mullion',(-3.054,-.83,1.5),(.14,.13,3),wall,.006)
box('Left continuous window sill',(-3.054,-.74,.06),(.14,3.46,.12),wall,.004)
box('Left continuous window header',(-3.054,-.74,2.91),(.14,3.46,.18),wall,.004)
current='Room_FrontWall'
box('Front continuous poured concrete wall',(0,-2.87,1.5),(6.14,.14,3),wall,.006)
# Warm rear-right timber makes a substantial architectural field. It frames
# glass and the existing bench while leaving a broad quiet mineral wall.
current='Room_BackWall'
for x in [-2.89,2.89]:box('Rear timber corner post',(x,2.90,1.50),(.14,.14,3.0),wood,.004)
box('Recessed vertical timber backing',(1.57,2.975,1.5),(2.50,.018,2.98),wood,.001)
for i in range(30):box('Vertical natural timber slat',(.35+i*.085,2.925,1.50),(.045,.075,2.98),wood,.002)
box('Rear integrated ice-jade shadow reveal',(.245,2.973,1.50),(.018,.025,2.78),reveal,.001)
for sign,label in [(-1,'Left'),(1,'Right')]:
 current='Room_'+label+'Wall';box(label+' timber edge post',(sign*2.91,-.40,1.50),(.14,.14,3.0),wood,.004)
current='Room_RightWall'
# A short return continues the timber field around the rear corner.
for i in range(12):box('Right timber return slat',(2.925,2.82-i*.085,1.50),(.075,.045,2.98),wood,.002)
box('Right low integrated ice-jade reveal',(2.976,1.73,.15),(.022,2.25,.014),reveal,.001)
current='Room_FrontWall'
for x in [-2.89,2.89]:box('Front timber corner post',(x,-2.72,1.50),(.14,.14,3.0),wood,.004)
current='Room_Floor'
box('Continuous textured concrete floor',(0,0,-.035),(12,12,.065),stone,.002)
current='Room_Glass'
box('Low iron architectural glass return',(.40,2.274,1.503),(.012,1.408,2.95),clear_glass,.003)
# Captured glazing: rear channel overlaps the timber backing; base channel
# starts at the pour and the head channel meets the bounded ceiling return.
current='Room_GlassFrame'
box('Glass floor channel',(.4,2.274,.01875),(.036,1.43,.0425),graphite,.002)
box('Glass rear attachment channel',(.4,2.972,1.5),(.036,.04,3),graphite,.002)
box('Glass supported head channel',(.4,2.274,2.99),(.036,1.43,.04),graphite,.002)
current='Room_WindowGlass'
for y,width in [(-1.65,1.43),(.07,1.52)]:
 box('Low iron full-height window glass',(-3.055,y,1.47),(.012,width,2.69),clear_glass,.002)

# Original botanical geometry. Closed blades have a rolled central ridge,
# tapered silhouette, slight torsion and a fine rim; no image cards are used.
def curve_stem(name,points,radius,material=stem):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=5;curve.bevel_depth=radius;curve.bevel_resolution=2
 spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
 for point,co in zip(spline.bezier_points,points):point.co=co;point.handle_left_type='AUTO';point.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);return finish(o,name,material)
def blade(name,start,direction,length,width,droop,material,segments=12,cross=4,twist=.09):
 start=Vector(start);d=Vector(direction).normalized();side=Vector((-d.y,d.x,0)).normalized();normal=d.cross(side).normalized();verts=[]
 for layer in [-1,1]:
  for i in range(segments+1):
   t=i/segments;shape=max(.012,math.sin(math.pi*t)**.78);center=start+d*(length*t)+Vector((0,0,-droop*t*t))+side*(twist*math.sin(math.pi*t)*t)
   for j in range(cross+1):
    v=2*j/cross-1;ridge=(1-v*v)*width*.11*math.sin(math.pi*t)
    co=center+side*(v*width*.5*shape)+normal*(ridge+v*twist*t*.14+layer*.0012);verts.append(tuple(co))
 n=(segments+1)*(cross+1);faces=[]
 for layer in range(2):
  off=layer*n
  for i in range(segments):
   for j in range(cross):
    a=off+i*(cross+1)+j;face=(a,a+1,a+cross+2,a+cross+1);faces.append(face if layer else tuple(reversed(face)))
 perimeter=list(range(cross+1))+[i*(cross+1)+cross for i in range(1,segments+1)]+list(range(segments*(cross+1)+cross-1,segments*(cross+1)-1,-1))+[i*(cross+1) for i in range(segments-1,0,-1)]
 for a,b in zip(perimeter,perimeter[1:]+perimeter[:1]):faces.append((a,b,b+n,a+n))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[tuple(reversed(face)) for face in faces]);mesh.update()
 # Positive signed volume verifies outward normals on every closed leaf.
 # Inward blades look plausible in two-sided previews but bake black.
 mesh.calc_loop_triangles();volume=sum(mesh.vertices[t.vertices[0]].co.dot(mesh.vertices[t.vertices[1]].co.cross(mesh.vertices[t.vertices[2]].co))/6 for t in mesh.loop_triangles)
 assert volume>0, name+' must have outward-facing closed geometry'
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,material)
 return [start+d*(length*t)+Vector((0,0,-droop*t*t))+normal*(width*.11*math.sin(math.pi*t)+.002) for t in [0,.25,.5,.75,1]]
def pot(name,base,radius,height):
 x,y=base;profile=[(radius*.78,.012),(radius*.80,.035),(radius*.97,height*.85),(radius,height-.025),(radius*.99,height),(radius*.87,height),(radius*.85,height-.045),(radius*.76,.055)]
 vertices=[(x+r*math.cos(2*math.pi*i/40),y+r*math.sin(2*math.pi*i/40),z) for r,z in profile for i in range(40)];faces=[]
 for k in range(len(profile)):
  for i in range(40):faces.append((k*40+i,k*40+(i+1)%40,((k+1)%len(profile))*40+(i+1)%40,((k+1)%len(profile))*40+i))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,planter)
 bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=radius*.86,depth=.018,location=(x,y,height-.049));finish(bpy.context.object,name+' planting surface',soil)
# Strelitzia-like blades fan out naturally, with staggered stems and no crown
# symmetry. The silhouette reads as a living sculptural plant at room scale.
current='Room_PlantBroadleaf';base=Vector((-1.95,2.00,.42));pot('Broadleaf tapered mineral vessel',base[:2],.27,.48)
for i,(angle,reach,height,length,width,droop) in enumerate([(15,.30,1.17,.76,.31,.14),(68,.32,.92,.83,.34,.20),(122,.38,1.35,.73,.29,.12),(179,.30,.80,.90,.36,.26),(225,.37,1.10,.83,.32,.16),(285,.35,1.52,.72,.29,.12),(330,.43,.72,.79,.32,.24),(105,.19,1.59,.66,.26,.09),(250,.24,1.27,.79,.30,.14)]):
 angle=math.radians(angle);rad=Vector((math.cos(angle),math.sin(angle),0));end=base+rad*reach+Vector((0,0,height-.42))
 curve_stem('Broadleaf elegant petiole',[base+rad*.035,base+rad*(reach*.32)+Vector((0,0,height*.50)),end],.009)
 midrib=blade('Broadleaf ridged living blade',end,rad*.72+Vector((0,0,.69)),length,width,droop,leaf if i%3 else leaf_light)
 curve_stem('Broadleaf raised central vein',midrib,.0024)
# Fine, arching kentia-style foliage complements the large waxy leaves.
current='Room_PlantPalm';base=Vector((2.42,2.39,.48));pot('Palm low mineral vessel',base[:2],.26,.52)
for f,(angle,height,reach) in enumerate([(165,1.23,.65),(195,1.48,.77),(220,1.35,.82),(245,1.16,.83),(267,1.58,.72),(282,1.43,.75)]):
 angle=math.radians(angle);rad=Vector((math.cos(angle),math.sin(angle),0));side=Vector((-rad.y,rad.x,0));crown=base+rad*.09+Vector((0,0,height-.48));tip=crown+rad*reach+Vector((0,0,-.37))
 curve_stem('Palm rising cane',[base+rad*.03,base+rad*.06+Vector((0,0,height*.6)),crown],.007)
 curve_stem('Palm arching rachis',[crown,crown+rad*(reach*.52)+Vector((0,0,.14)),tip],.004)
 for i in range(11):
  t=(i+.6)/12;center=crown+rad*(reach*t)+Vector((0,0,.5*t-.87*t*t));length=.34*(math.sin(math.pi*t)**.55)+.09
  for sign in [-1,1]:blade('Palm tapered individual pinna',center,side*sign*.82+rad*.36+Vector((0,0,-.24)),length,.043*(1-t*.45),.12,leaf_light if (i+f)%3 else leaf_dark,segments=6,cross=2,twist=.025)
# A low, sparse evergreen accent inhabits the side perimeter only.
current='Room_PlantSculptural';base=Vector((2.50,-1.52,.29));pot('Evergreen rounded mineral vessel',base[:2],.21,.33)
for i in range(8):
 angle=i*2.399;rad=Vector((math.cos(angle),math.sin(angle),0));height=[.68,.92,.75,1.06,.79,.64,.98,.86][i]
 blade('Evergreen upright sculptural blade',base+rad*.045,rad*(.16+(i%3)*.04)+Vector((0,0,1)),height,.095,.08,leaf_dark if i%2 else leaf,segments=12,cross=4,twist=.035)

# Reuse only the original CC0 upholstered bench; no separate armrest or tools.
current='Room_TreatmentBed';before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(HERE,'..','atelier','treatment-bed.glb'))
# Stable join anchor is required for repeatable transforms and checkpoint UVs.
bedobjects=sorted(set(bpy.context.scene.objects)-before,key=lambda o:o.name)
root=bpy.data.objects.new('Treatment bed placement',None);bpy.context.collection.objects.link(root);root.location=(1.6,1.5,-.0045);root.rotation_euler.z=math.radians(-35)
for o in bedobjects:
 if o.parent is None:o.parent=root
 if o.type in {'MESH','CURVE'}:groups.setdefault(current,[]).append(o)

# The original asset's outer legs end at .13 m, above cross feet ending at
# .10 m. Four matching spigots overlap both, keeping every original face.
for x in [-.235,.235]:
 for y in [-.57,.57]:
  o=cylinder('Trestle structural foot spigot',(x,y,.085),(x,y,.145),.024,graphite,24,.002);o.parent=root

# Bounded perimeter ceiling returns are supported continuously by the walls.
# They provide honest mounting/reflecting surfaces without roofing the body.
current='Room_CeilingRear'
box('Rear concrete ceiling return',(0,2.835,3.015),(6.14,.58,.09),wall,.004)
box('Glazing head ceiling support',(.4,2.274,3.035),(.12,1.43,.13),wall,.004)
current='Room_CeilingRight'
box('Right concrete ceiling return',(2.835,.14,3.015),(.58,5.42,.09),wall,.004)
for group,center,along in [('Room_CeilingRear',(-1.2,2.76,2.78),'x'),('Room_CeilingRight',(2.76,.40,2.78),'y')]:
 current=group;x,y,z=center;length=1.05;width=.13
 size=(length,width,.065) if along=='x' else (width,length,.065)
 box('Closed underside of baffled ceiling uplight',center,size,fixture_shell,.008)
 # Two rods attach through the soffit underside, with small mounting rosettes.
 for offset in [-.38,.38]:
  a=(x+offset,y,z+.02) if along=='x' else (x,y+offset,z+.02)
  cylinder('Ceiling uplight support rod',a,(a[0],a[1],2.99),.009,graphite,16,.001)
  cylinder('Flush soffit mounting rosette',(a[0],a[1],2.963),(a[0],a[1],2.978),.028,graphite,24,.001)
 # Downward faces are opaque. Emitter is a single upward-facing recessed quad.
 for offset in [-1,1]:
  loc=(x,y+offset*.059,z+.042) if along=='x' else (x+offset*.059,y,z+.042)
  box('Raised ceiling emitter side baffle',loc,(length,.012,.055) if along=='x' else (.012,length,.055),fixture_shell,.002)
 for offset in [-1,1]:
  loc=(x+offset*.519,y,z+.042) if along=='x' else (x,y+offset*.519,z+.042)
  box('Ceiling emitter end shield',loc,(.012,width,.055) if along=='x' else (width,.012,.055),fixture_shell,.002)
 bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y,z+.034));o=bpy.context.object;o.scale=(.98,.095,1) if along=='x' else (.095,.98,1);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,'Upward concealed ceiling emitter',emitter)

floor_lamps=[('Room_FloorLampLeft',-2.55,2.74,1.82),('Room_FloorLampRight',2.64,-.46,1.64)]
for group,x,y,height in floor_lamps:
 current=group
 cylinder('Weighted floor uplight base',(x,y,-.0025),(x,y,.0395),.20,graphite,40,.004)
 cylinder('Floor uplight slender stem',(x,y,.025),(x,y,height-.025),.016,graphite,24,.002)
 cylinder('Floor uplight closed underside',(x,y,height-.035),(x,y,height-.008),.18,fixture_shell,40,.005)
 ring('Deep upward-only floor lamp rim',(x,y,height+.018),.18,.158,.065,fixture_shell)
 upward_disc('Upward recessed floor lamp emitter',(x,y,height-.006),.152)

# Directional window daylight and restrained architectural cool spill are baked once.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.cycles.device='CPU';scene.cycles.max_bounces=6;scene.cycles.diffuse_bounces=4;scene.cycles.transmission_bounces=6
scene.cycles.seed=0
world=bpy.data.worlds.new('Neutral studio ambient');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.80,.82,.84,1);world.node_tree.nodes['Background'].inputs[1].default_value=.22
def area(name,loc,target,power,size,color=(1,1,1),size_y=None):
 d=bpy.data.lights.new(name,'AREA');d.energy=power*.20;d.color=color;d.shape='RECTANGLE';d.size=size;d.size_y=size_y or size;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
# The actual left apertures cast long, soft diagonal light across the pour.
area('Tall glazed side daylight',(-4.5,-1.1,2.25),(1.7,1.5,.7),1800,2.6,(1,.965,.88),2.5)
area('Quiet overhead daylight',(0,.6,4.3),(0,1,0),300,4.5,(1,1,.985),4.5)
area('Quiet front fill',(1,-3.5,3.2),(0,1,1),130,4.0,(.94,.975,1),3.0)
d=bpy.data.lights.new('Long diagonal window sunlight','SUN');d.energy=1.55;d.angle=.045;d.color=(1,.945,.83)
o=bpy.data.objects.new(d.name,d);bpy.context.collection.objects.link(o);o.rotation_euler=(Vector((2,2,.0))-Vector((-6,-4,6))).to_track_quat('-Z','Y').to_euler()
area('Rear ice-jade reveal spill',(.24,2.84,1.5),(-.30,2.97,1.5),10,.065,(.43,.83,.87),2.6)
area('Right ice-jade reveal spill',(2.84,1.8,.16),(2.4,1.8,.02),8,2.1,(.42,.81,.86),.05)
# Very low-power warm accents, directed upward into the perimeter returns.
# Existing daylight, ambient, exposure and every runtime body light are intact.
area('Rear ceiling concealed uplight',(-1.2,2.76,2.819),(-1.2,2.76,3.0),10,.9,(1,.89,.70),.085)
area('Right ceiling concealed uplight',(2.76,.4,2.819),(2.76,.4,3.0),10,.085,(1,.89,.70),.9)
for group,x,y,height in floor_lamps:area(group+' shielded uplight',(x,y,height-.002),(x,y,3.0),5,.20,(1,.89,.70),.20)
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
camd=bpy.data.cameras.new('Acceptance camera');cam=bpy.data.objects.new('Acceptance camera',camd);bpy.context.collection.objects.link(cam);cam.location=(.65,-4.4,1.08);cam.rotation_euler=(Vector((0,0,.85))-cam.location).to_track_quat('-Z','Y').to_euler();camd.lens=32;scene.camera=cam

# Check real emitter normals and shielding before semantic merging removes
# component identity. Downward rays must hit the fixture itself, within 30 cm.
bpy.context.view_layer.update();depsgraph=bpy.context.evaluated_depsgraph_get();shielding=[]
for group in ['Room_CeilingRear','Room_CeilingRight','Room_FloorLampLeft','Room_FloorLampRight']:
 for o in groups[group]:
  if not o.name.startswith(('Upward concealed','Upward recessed')):continue
  assert all((o.matrix_world.to_3x3()@p.normal).z>.99 for p in o.data.polygons), 'Emitter must face upward'
  center=sum((o.matrix_world@v.co for v in o.data.vertices),Vector())/len(o.data.vertices)
  for elevation in [-5,-30,-60,-89]:
   for azimuth in range(0,360,45):
    e,a=math.radians(elevation),math.radians(azimuth);direction=Vector((math.cos(e)*math.cos(a),math.cos(e)*math.sin(a),math.sin(e)))
    hit,loc,normal,index,ob,matrix=scene.ray_cast(depsgraph,center-Vector((0,0,.0001)),direction,distance=.30)
    assert hit and ob in groups[group] and ob!=o, group+' must shield downward emitter rays'
  shielding.append({'group':group,'emitterNormal':[0,0,1],'downwardShieldRays':32})
print('FIXTURE_SHIELDING_VERIFIED',json.dumps(shielding),flush=True)

# Apply geometry then merge by semantic group; glass retains a physical material.
for name,objs in groups.items():
 for o in objs:
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
  if o.type!='MESH':bpy.ops.object.convert(target='MESH')
  for mod in list(o.modifiers):
   try:bpy.ops.object.modifier_apply(modifier=mod.name)
   except RuntimeError:pass
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();joined=bpy.context.object;joined.name=name;joined.data.name=name;joined['bakedRoom']=name not in {'Room_Glass','Room_WindowGlass'};joined['roomGlass']=name in {'Room_Glass','Room_WindowGlass'}
 groups[name]=joined
 if name=='Room_FrontWall':joined.visible_camera=False
 for p in joined.data.polygons:p.use_smooth=True

authoring_triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in groups.values())
print('AUTHORING_TRIANGLES',authoring_triangles,flush=True)
assert authoring_triangles<=75000, 'Room exceeds the agreed triangle budget'
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT,'authoring.blend'))
if not SKIP_PREVIEWS:
 scene.render.filepath=os.path.join(OUTPUT,'preview.png');bpy.ops.render.render(write_still=True)
 print('PREVIEW_READY',flush=True)
if PREVIEW_ONLY:
 print('PREVIEW_ONLY_COMPLETE',flush=True);sys.exit(0)

def bake_group(objects,name,res,reuse_path=None):
 scene.cycles.samples=128
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.006,area_weight=.2,correct_aspect=True);bpy.ops.object.mode_set(mode='OBJECT')
 if reuse_path:
  image=bpy.data.images.load(reuse_path,check_existing=False);image.name=name;image.colorspace_settings.name='sRGB';return image
 image=bpy.data.images.new(name,width=res,height=res,alpha=False,float_buffer=False);image.generated_color=(.3,.3,.3,1);image.colorspace_settings.name='sRGB'
 for o in objects:
  for m in o.data.materials:
   if not m:continue
   m.use_nodes=True;node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=image;node.select=True;m.node_tree.nodes.active=node
 scene.render.bake.use_pass_emit=True;scene.render.bake.use_pass_glossy=False;scene.render.bake.use_pass_transmission=False;scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=True;scene.render.bake.margin=8;scene.render.bake.use_clear=False
 bpy.ops.object.bake(type='COMBINED')
 # OIDN on the linear diffuse bake removes Monte Carlo grain from broad walls.
 # Atlas gutters keep the denoiser away from unrelated neighboring islands.
 tree=bpy.data.node_groups.new(name+' denoise','CompositorNodeTree');scene.compositing_node_group=tree
 tree.interface.new_socket(name='Image',in_out='OUTPUT',socket_type='NodeSocketColor')
 src=tree.nodes.new('CompositorNodeImage');src.image=image;dn=tree.nodes.new('CompositorNodeDenoise');out=tree.nodes.new('NodeGroupOutput');tree.links.new(src.outputs['Image'],dn.inputs['Image']);tree.links.new(dn.outputs['Image'],out.inputs['Image'])
 prevres=(scene.render.resolution_x,scene.render.resolution_y);scene.render.resolution_x=res;scene.render.resolution_y=res;scene.cycles.samples=1;bpy.ops.render.render()
 path=os.path.join(HERE,name+'.jpg');scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=92;bpy.data.images['Render Result'].save_render(path,scene=scene)
 scene.compositing_node_group=None;scene.render.resolution_x,scene.render.resolution_y=prevres;scene.render.image_settings.file_format='PNG';scene.cycles.samples=32
 image.name=name+' raw';denoised=bpy.data.images.load(path,check_existing=False);denoised.name=name;denoised.colorspace_settings.name='sRGB';return denoised

floor=groups['Room_Floor'];other=[o for n,o in groups.items() if n not in {'Room_Floor','Room_Glass','Room_WindowGlass'}]
# Room bake checkpoint: deterministic UVs are replayed before cached radiance.
# A matching source recipe and atlas hash prevent accidental reuse after edits.
recipe=hashlib.sha256(open(__file__,'rb').read().split(b'# Room bake checkpoint:')[0]).hexdigest()
checkpoint_path=os.path.join(OUTPUT,'room-bake-checkpoint.json');room_atlas_path=os.path.join(HERE,'room-lighting.jpg')
if '--reuse-room-atlas' in sys.argv:
 with open(checkpoint_path) as f:checkpoint=json.load(f)
 assert checkpoint['recipeSha256']==recipe, 'Room bake checkpoint does not match this scene recipe'
 assert checkpoint['atlasSha256']==hashlib.sha256(open(room_atlas_path,'rb').read()).hexdigest(), 'Room bake checkpoint atlas changed'
 atlas=bake_group(other,'room-lighting',2048,reuse_path=room_atlas_path)
 print('ROOM_ATLAS_REUSED',flush=True)
else:
 atlas=bake_group(other,'room-lighting',2048)
 with open(checkpoint_path,'w') as f:json.dump({'recipeSha256':recipe,'atlasSha256':hashlib.sha256(open(room_atlas_path,'rb').read()).hexdigest(),'samples':128},f,indent=2)
flooratlas=bake_group([floor],'floor-lighting',1024)
def baked_material(name,image,unlit):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();out=n.new('ShaderNodeOutputMaterial');tex=n.new('ShaderNodeTexImage');tex.image=image
 if unlit:
  # A color directly into Surface is Blender's supported shadeless glTF graph.
  m.node_tree.links.new(tex.outputs['Color'],out.inputs['Surface'])
 else:
  shader=n.new('ShaderNodeBsdfPrincipled');m.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);m.node_tree.links.new(shader.outputs[0],out.inputs['Surface']);shader.inputs['Roughness'].default_value=.91
 return m
unlit=baked_material('Baked zen studio radiance',atlas,True);floormat=baked_material('Floor baked indirect PBR',flooratlas,False)
for o in other:o.data.materials.clear();o.data.materials.append(unlit)
floor.data.materials.clear();floor.data.materials.append(floormat)
floor.data.materials[0]=baked_material('Floor exact-bake preview',flooratlas,True)
if not SKIP_PREVIEWS:
 scene.render.filepath=os.path.join(OUTPUT,'preview-baked.png');bpy.ops.render.render(write_still=True)
floor.data.materials[0]=floormat
bpy.ops.object.select_all(action='DESELECT')
for o in groups.values():o.select_set(True)
bpy.context.view_layer.objects.active=floor
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE,'treatment-room.glb'),export_format='GLB',use_selection=True,export_apply=True,export_image_format='JPEG',export_jpeg_quality=92,export_extras=True)
atlas.pack();flooratlas.pack()
bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT,'treatment-room.blend'))
stats={'meshCount':len(groups),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in groups.values()),'meshes':list(groups),'atlasSize':[2048,2048],'floorAtlasSize':[1024,1024],'coordinateSystem':'glTF Y up, metres; back wall z=-3; body origin 0,0,0','bakedLighting':'diffuse direct + indirect + albedo + integrated emission, sRGB JPEG, unlit KHR_materials_unlit except PBR floor and physical glass','glassNote':'Room_Glass and Room_WindowGlass are live physical glass. Preserve its loaded glTF material, include it in furniture cutaways, and never convert it to baked MeshBasic.', 'decodedTextureBytesWithMipmaps':27962027,'floorNote':'PBR baseColor includes static lighting. Replace with MeshBasic material for exact bake and multiply custom dynamic shadow overlay, or use standard material at ambient-only baseline to avoid re-lighting the baked texture.','buildSeconds':round(time.monotonic()-STARTED,2)}
with open(os.path.join(OUTPUT,'asset-stats.json'),'w') as f:json.dump(stats,f,indent=2)
def file_record(path):
 with open(path,'rb') as f:data=f.read()
 return {'file':os.path.relpath(path,HERE),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
# Measure authored mesh vertices rather than retaining a prior scene's bounds.
points=[o.matrix_world@v.co for o in groups.values() for v in o.data.vertices]
span=[max(p[i] for p in points)-min(p[i] for p in points) for i in range(3)]
dimensions=[round(span[i],6) for i in [0,2,1]]
provenance={
 'schemaVersion':1,'asset':'Inkform zen cyberpunk studio','authoringVersion':'7.0.0',
 'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'software':'Blender '+bpy.app.version_string,'license':'CC0-1.0',
 'runtimeFiles':[file_record(os.path.join(HERE,n)) for n in ['treatment-room.glb','room-lighting.jpg','floor-lighting.jpg']],
 'authoringScript':file_record(__file__),
 'geometry':{'triangles':stats['triangles'],'meshes':stats['meshCount'],'drawCalls':stats['meshCount'],'units':'metres','coordinateSystem':'glTF Y up','dimensionsMetres':dimensions},
 'budgets':{'maxTriangles':75000,'maxMainDrawCalls':16,'maxGlbBytes':3000000,'maxDecodedTextureBytes':67108864,'maxCompressedImageBytes':3000000},
 'materials':{'opaque':'Shared baked radiance; KHR_materials_unlit except floor','glass':'Room_Glass and Room_WindowGlass use KHR_materials_transmission and KHR_materials_ior; retain physical material at runtime'},
 'bake':{'device':'CPU','samples':128,'denoiser':'OpenImageDenoise','roomAtlas':[2048,2048],'floorAtlas':[1024,1024],'encoding':'sRGB JPEG','components':['diffuse direct','diffuse indirect','albedo','integrated architectural emission']},
 'sceneContent':['four semantic mineral concrete walls; left wall has two tall glazed apertures','warm rear-right vertical timber field and short return with two restrained ice-jade light reveals','one continuous textured 12 by 12 metre concrete floor without panel joints','original graphite upholstered tattoo bench grounded by 4.5 mm with four structural foot spigots','one captured architectural glass return with floor, rear and head channels plus two window panes','three original sculptural perimeter plants: broadleaf, fine arching palm, upright evergreen in mineral vessels','two baffled ceiling uplights on wall-supported perimeter ceiling returns','two shielded floor uplights with weighted bases and slender stems'],
 'physicalChecks':{'floorTopMetres':-.0025,'benchGroundingDeltaMetres':-.0045,'sourceLegGapMetres':.03,'addedSpigotSpanMetres':[.085,.145],'glassCapturedBy':['floor channel','rear timber connection','supported head channel'],'fixtureShielding':shielding},
 'lightingBaseline':{'sunEnergy':1.55,'worldStrength':.22,'exposure':0,'daylightAreaWatts':[360,60,26],'existingRevealAreaWatts':[2,1.6],'addedIndirectAreaWatts':[2,2,1,1],'runtimeBodyLighting':'unchanged'},
 'sources':[dict(file_record(os.path.join(HERE,'..','atelier','treatment-bed.glb')),license='CC0-1.0',origin='Original locally authored furniture',authoringFile='../atelier/create_assets.py',authoringSource=file_record(os.path.join(HERE,'..','atelier','create_assets.py')))],
 'externalAssets':[],'externalAssetStatement':'No downloaded models, photos, textures, paid APIs or other external assets used. All remaining geometry and procedural materials are original local authoring.'
}
with open(os.path.join(HERE,'provenance.json'),'w') as f:json.dump(provenance,f,indent=2);f.write('\n')
print('ASSET_COMPLETE',json.dumps(stats),flush=True)
