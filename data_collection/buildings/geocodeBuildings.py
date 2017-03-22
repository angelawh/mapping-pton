import googlemaps

gmaps = googlemaps.Client(key='AIzaSyD45GL4tlbFJORhDFw2ghCtTFIF3jqsK_g')

f = open('buildings_final.txt', 'r')
out = open('buildings_w_coords.txt', 'w')

b = f.readline()

while b != "":
	geocode_result = gmaps.geocode(b +', Princeton, NJ')

	b = b.strip()

	if len(geocode_result) > 0:
		lat = geocode_result[0]['geometry']['location']['lat']
		lon = geocode_result[0]['geometry']['location']['lng']
		out.write(b + ', ' + str(lat) + ', '+ str(lon) + '\n')
	else:
		out.write(b + '\n')

	print b
	b = f.readline()