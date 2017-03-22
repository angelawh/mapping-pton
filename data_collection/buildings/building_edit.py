f_read = open('all_buildings.txt', 'r')
f_write = open('buildings_final.txt', 'w')


line = f_read.readline()

while line != "":
	strs = line.split(' ')
	l = len(strs[-1])
	line = line[:-l]
	f_write.write(line + '\n')
	line = f_read.readline()