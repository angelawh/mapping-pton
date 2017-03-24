from __future__ import unicode_literals

from django.db import models


#################################################################
## 
class BuildingComplex(models.Model):
	pass

class Building(models.Model):
	name = models.CharField(max_length=100)
	lat = models.DecimalField(max_length=15, decimal_places=7)
	lon = models.DecimalField(max_length=15, decimal_places=7)
	b_complex = models.ForeignKey(BuildingComplex, on_delete=models.CASCADE)

class Floor(models.Model):
	number = models.CharField(max_length=10)
	plan_file = models.FileField(upload_to='floor_plans/')
	plan_scale = models.IntegerField()
	b_complex = models.ForeignKey(BuildingComplex, on_delete=models.CASCADE)
	building = models.ForeignKey(Building, on_delete=models.CASCADE)

class Change_Floor(model.Model):
	b_complex = models.ForeignKey(BuildingComplex, on_delete=models.CASCADE)
	building = models.ForeignKey(Building, on_delete=models.CASCADE)

	class Meta:
		abstract = True

class Stair_Set(Change_Floor):
	stair_id = models.CharField(max_length=10)

class Elevator_Set(Change_Floor):
	elevator_id = models.CharField(max_length=10)
	

#################################################################

class Node(models.Model):
	node_id = models.CharField(max_length=25, primary_key=True)
	x = models.IntegerField()
	y = models.IntegerField()
	b_complex = models.ForeignKey(BuildingComplex, on_delete=models.CASCADE)
	building = models.ForeignKey(Building, on_delete=models.CASCADE)
	floor = models.ForeignKey(Floor, on_delete=models.CASCADE)

class Room(Node):
	number = models.CharField(max_length=25, null=True)

class Bathroom(Room):
	GENDERS = (
	    ('M', 'Male'),
	    ('F', 'Female'),
	    ('N', 'Neutral'),
	)
	gender = models.CharField(max_length=1, choices=GENDERS)

class Printer(Room):
	pass
class Laundry(Room):
	pass

class Stair(Node):
	pass
class Elevator(Node):
	pass
class Accessibility(Node):
	pass
class Entryway(Node):
	E_TYPES = (
	    ('I', 'Indoor'),
	    ('O', 'Outdoor'),
	    ('C', 'Building Connection'),
	)
	e_type = models.CharField(max_length=1, choices=E_TYPES)
	number = models.CharField(max_length=25, null=True)
	isDoor = models.BooleanField(default=False)
	exit_only = models.BooleanField(default=False)
	lat = models.DecimalField(max_length=15, decimal_places=7, null = True)
	lon = models.DecimalField(max_length=15, decimal_places=7, null = True)



class Edge(models.Model):
	nodes = models.ManyToManyField(Node)
	# weight = models.IntegerField()


class Person(models.Model):
	netid = models.CharField(max_length=25, primary_key=True)
	name = models.CharField(max_length=100)
	room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True)

	class Meta:
		abstract = True

class Prof(Person):
	dept = models.CharField(max_length=100)

class Student(Person):
	year = models.IntegerField()