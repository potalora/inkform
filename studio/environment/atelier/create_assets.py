"""Original atelier furniture. Run with Blender --background --python this_file.
No external models or textures; dimensions are metres. CC0-1.0.
"""
import bpy, math, os
from mathutils import Vector

HERE=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name, rgb, rough=.5, metallic=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metallic
 return m
leather=material('Graphite upholstered vinyl',(.055,.063,.065),.67)
seam=material('Dark stitched upholstery welt',(.025,.031,.032),.8)
steel=material('Satin stainless steel',(.42,.45,.46),.28,.85)
base=material('Powder coated graphite',(.075,.08,.081),.68)
oak=material('Pale natural oak',(.55,.40,.25),.76)
oakedge=material('Oak end grain',(.43,.30,.18),.8)
black=material('Rubber casters and handles',(.025,.027,.027),.85)
def finish(obj,name,mat,bevel=0):
 obj.name=name;obj.data.materials.append(mat)
 if bevel:
  mod=obj.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=5
  mod=obj.modifiers.new('Stable weighted normals','WEIGHTED_NORMAL')
 for p in obj.data.polygons:p.use_smooth=True
 return obj
def box(name, loc, size, mat, bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);obj=bpy.context.object;obj.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 return finish(obj,name,mat,bevel)
def cylinder(name,a,b,r,mat,vertices=24):
 a,b=Vector(a),Vector(b);d=b-a
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=d.length,location=(a+b)/2)
 obj=bpy.context.object;obj.rotation_mode='QUATERNION';obj.rotation_quaternion=d.to_track_quat('Z','Y')
 return finish(obj,name,mat,.008)
def padded(name,loc,width,length,thick,angle=0):
 # Rounded outline with tapered shoulder width, extruded with a rolled edge.
 r=min(.10,width*.17,length*.17);pts=[]
 for cx,cy,start in [(width/2-r,length/2-r,0),(-width/2+r,length/2-r,90),(-width/2+r,-length/2+r,180),(width/2-r,-length/2+r,270)]:
  for i in range(9):
   a=math.radians(start+i*90/8);pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
 verts=[(x*(.96 if y<0 else 1),y,z) for z in [-thick/2,thick/2] for x,y in pts];n=len(pts)
 faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.location=loc;obj.rotation_euler.x=math.radians(angle);finish(obj,name,leather,.027)
 # A narrow inset welt outlines the real cushion surface rather than painted lines.
 curve=bpy.data.curves.new(name+' welt','CURVE');curve.dimensions='3D';curve.bevel_depth=.002;curve.bevel_resolution=2
 poly=curve.splines.new('POLY');poly.points.add(n-1)
 for point,(x,y) in zip(poly.points,pts):point.co=(x*.96,y*.97,thick/2-.012,1)
 poly.use_cyclic_u=True;welt=bpy.data.objects.new(name+' upholstery seam',curve);bpy.context.collection.objects.link(welt);welt.location=loc;welt.rotation_euler=obj.rotation_euler;welt.data.materials.append(seam)
 return obj

# Flat tattoo treatment bed: full real-world length, two slim upholstered
# sections, a slightly adjustable head section and two height-adjustable trestles.
padded('Flat main treatment cushion',(0,.26,.675),.65,1.27,.09)
padded('Adjustable flat head section',(0,-.64,.674),.65,.52,.09,-3)
box('Slim upholstered support frame',(0,0,.608),(.59,1.74,.045),base,.016)
for y in [-.57,.57]:
 box('Transverse upper support',(0,y,.565),(.55,.055,.055),base,.012)
 for x in [-.235,.235]:
  cylinder('Adjustable trestle outer',(x,y,.13),(x,y,.405),.025,base)
  cylinder('Satin telescopic leg',(x,y,.33),(x,y,.565),.018,steel)
  # Real collars and small tension knobs explain the height adjustment.
  cylinder('Height adjustment collar',(x,y,.385),(x,y,.425),.031,base)
  cylinder('Leg tension knob',(x,y-.025,.405),(x,y-.056,.405),.013,black,16)
 box('Low trestle cross foot',(0,y,.065),(.61,.075,.07),base,.025)
 for x in [-.255,.255]:box('Non-slip bed foot',(x,y,.022),(.09,.09,.04),black,.014)
for x in [-.235,.235]:
 cylinder('Longitudinal lower brace',(x,-.57,.25),(x,.57,.25),.014,steel)
cylinder('Head section hinge',(-.27,-.38,.605),(.27,-.38,.605),.014,steel)
for x in [-.21,.21]:
 cylinder('Head angle support',(x,-.73,.54),(x,-.47,.605),.011,steel)

# Low oak cabinet, separate fitted doors, inset top and recessed toe kick.
bed=list(bpy.context.scene.objects)
for obj in bed:obj.select_set(True)
bpy.context.view_layer.objects.active=bed[0]
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE,'treatment-bed.glb'),export_format='GLB',use_selection=True,export_apply=True)
for obj in bed:bpy.data.objects.remove(obj,do_unlink=True)
box('Cabinet carcass',(0,0,.48),(1.55,.44,.84),oak,.025)
box('Cabinet inset plinth',(0,.025,.065),(1.40,.34,.13),oakedge,.01)
box('Solid oak rounded worktop',(0,-.01,.925),(1.62,.49,.055),oak,.018)
for x in [-.51,0,.51]:
 box('Fitted oak door',(x,-.238,.49),(.493,.028,.76),oak,.008)
 box('Slim recessed pull',(x,-.26,.80),(.20,.012,.009),base,.003)
 # restrained real geometry grain rhythm, different door board widths
 for dx in [-.17,-.06,.07,.18]:box('Oak board joint',(x+dx,-.254,.49),(.0015,.001,.70),oakedge,.0003)
for obj in bpy.context.scene.objects:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE,'oak-cabinet.glb'),export_format='GLB',use_selection=True,export_apply=True)
print('Atelier furniture exported to',HERE)
