import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

public class Generator {

	public static void main(String[] args) {
		String seed = "1";
		String fileName = null;
		for (int i = 0; i < args.length; i++) {
			if (args[i].equals("-seed"))
				seed = args[++i];
			if (args[i].equals("-file"))
				fileName = args[++i];
		}
		if (fileName == null) {
			fileName = seed;
		}
		new Generator().generate(seed, fileName);
	}

	int N = 50;
	int tkmProb = 1000; // 1/1000 = 0.1%

	void generate(String seedStr, String fileName) {
		// generate test case
		SecureRandom rnd;
		try {
			rnd = SecureRandom.getInstance("SHA1PRNG");
			long seed = Long.parseLong(seedStr);
			rnd.setSeed(seed);

			char[][] map = new char[N][N];
			for (int i = 0; i < N; i++) {
				for (int j = 0; j < N; j++) {
					if (rnd.nextInt(tkmProb) == 0) {
						map[i][j] = '#';
					} else {
						map[i][j] = '.';
					}
				}
			}
			int x = rnd.nextInt(N);
			int y = rnd.nextInt(N);
			map[x][y] = 'W';

			// write file
			File file = new File(fileName + ".txt");
			try {
				FileWriter filewriter = new FileWriter(file);
				for (int i = 0; i < N; i++) {
					for (int j = 0; j < N; j++) {
						filewriter.write(map[i][j]);
					}
					filewriter.write("\r\n");
				}
				filewriter.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		} catch (NoSuchAlgorithmException e) {
			e.printStackTrace();
		}
	}
}
